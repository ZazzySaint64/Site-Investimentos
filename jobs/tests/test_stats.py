from datetime import date

import pandas as pd
import pytest

from pipeline.stats import (
    annualized_cdi,
    compute_asset_stats,
    compute_sector_stats,
    monthly_returns,
)


def ts(text):
    return pd.Timestamp(text)


def prices(values):
    return pd.Series({ts(day): float(value) for day, value in values.items()})


def daily(months):
    index = pd.bdate_range("2025-01-01", periods=months * 21)
    return pd.Series(range(100, 100 + len(index)), index=index, dtype=float)


def monthly_const(value, months, start="2025-01"):
    return pd.Series([value] * months, index=pd.date_range(f"{start}-01", periods=months, freq="MS"))


def monthly_alt(a, b, months, start="2025-01"):
    values = [a if i % 2 == 0 else b for i in range(months)]
    return pd.Series(values, index=pd.date_range(f"{start}-01", periods=months, freq="MS"))


def cdi_flat(pct=0.05, days=252):
    return pd.Series([pct] * days, index=pd.bdate_range("2025-01-01", periods=days))


def test_monthly_returns_excludes_current_month():
    s = prices({"2026-08-31": 100, "2026-09-30": 110, "2026-10-30": 121, "2026-11-03": 200})
    r = monthly_returns(s, date(2026, 11, 3))
    assert list(r.index.strftime("%Y-%m-%d")) == ["2026-09-01", "2026-10-01"]
    assert r.iloc[0] == pytest.approx(0.10) and r.iloc[1] == pytest.approx(0.10)


def test_monthly_returns_includes_month_when_today_is_next_month():
    s = prices({"2026-09-30": 100, "2026-10-30": 110})
    assert len(monthly_returns(s, date(2026, 11, 1))) == 1


def test_monthly_returns_uses_last_price_of_each_month():
    s = prices({"2026-09-01": 50, "2026-09-30": 100, "2026-10-01": 500, "2026-10-30": 110})
    assert monthly_returns(s, date(2026, 11, 1)).iloc[0] == pytest.approx(0.10)


def test_monthly_returns_of_a_single_month_is_empty():
    assert monthly_returns(prices({"2026-10-30": 110}), date(2026, 11, 3)).empty


def test_return_annual_of_constant_one_percent():
    stats = compute_asset_stats(daily(13), monthly_const(0.01, 12), cdi_flat(), None)
    assert stats["return_annual"] == pytest.approx(0.126825, abs=1e-6)


def test_volatility_uses_sample_std_annualized():
    m = monthly_alt(0.02, -0.01, 12)
    stats = compute_asset_stats(daily(13), m, cdi_flat(), None)
    assert stats["volatility"] == pytest.approx(m.std(ddof=1) * 12**0.5)


def test_zero_volatility_gives_null_sharpe():
    stats = compute_asset_stats(daily(13), monthly_const(0.01, 12), cdi_flat(), None)
    assert stats["sharpe"] is None


def test_sharpe_subtracts_cdi():
    m = monthly_alt(0.03, -0.01, 12)
    s = compute_asset_stats(daily(13), m, cdi_flat(), None)
    expected = (s["return_annual"] - annualized_cdi(cdi_flat())) / s["volatility"]
    assert s["sharpe"] == pytest.approx(expected)


def test_sharpe_is_null_without_cdi():
    m = monthly_alt(0.03, -0.01, 12)
    empty = pd.Series(dtype=float, index=pd.DatetimeIndex([]))
    assert compute_asset_stats(daily(13), m, empty, None)["sharpe"] is None


def test_cdi_outside_the_window_is_ignored():
    m = monthly_alt(0.03, -0.01, 12)
    high_old_rate = pd.Series([1.0] * 5, index=pd.bdate_range("2020-01-01", periods=5))
    with_old = pd.concat([high_old_rate, cdi_flat()])
    s = compute_asset_stats(daily(13), m, with_old, None)
    expected = (s["return_annual"] - annualized_cdi(cdi_flat())) / s["volatility"]
    assert s["sharpe"] == pytest.approx(expected)


def test_max_drawdown_known_series():
    s = prices({"2026-01-01": 100, "2026-01-02": 120, "2026-01-03": 60, "2026-01-04": 90})
    stats = compute_asset_stats(s, monthly_alt(0.02, -0.01, 12), cdi_flat(), None)
    assert stats["max_drawdown"] == pytest.approx(-0.5)


def test_max_drawdown_ignores_prices_before_the_window():
    old = prices({"2010-01-04": 1000})
    recent = prices({"2026-01-01": 100, "2026-01-02": 90})
    stats = compute_asset_stats(pd.concat([old, recent]), monthly_alt(0.02, -0.01, 12), cdi_flat(), None)
    assert stats["max_drawdown"] == pytest.approx(-0.1)


def test_under_12_months_gives_all_null():
    stats = compute_asset_stats(daily(5), monthly_const(0.01, 11), cdi_flat(), None)
    assert all(v is None for v in stats.values())
    assert set(stats) == {"return_annual", "volatility", "sharpe", "max_drawdown", "corr_benchmark"}


def test_window_is_limited_to_60_months():
    old_then_new = pd.concat(
        [monthly_const(0.50, 12, start="2015-01"), monthly_const(0.01, 60, start="2020-01")]
    )
    stats = compute_asset_stats(daily(13), old_then_new, cdi_flat(), None)
    assert stats["return_annual"] == pytest.approx(0.126825, abs=1e-6)


def test_perfect_correlation_with_benchmark():
    m = monthly_alt(0.02, -0.01, 12)
    stats = compute_asset_stats(daily(13), m, cdi_flat(), m)
    assert stats["corr_benchmark"] == pytest.approx(1.0)


def test_correlation_needs_12_months_in_common():
    m = monthly_alt(0.02, -0.01, 12)
    stats = compute_asset_stats(daily(13), m, cdi_flat(), m.iloc[:11])
    assert stats["corr_benchmark"] is None


def test_correlation_with_constant_benchmark_is_null():
    m = monthly_alt(0.02, -0.01, 12)
    stats = compute_asset_stats(daily(13), m, cdi_flat(), monthly_const(0.01, 12))
    assert stats["corr_benchmark"] is None


def test_annualized_cdi_of_constant_rate():
    assert annualized_cdi(cdi_flat(pct=0.05, days=252)) == pytest.approx(1.0005**252 - 1)


def test_sector_worst_month_uses_simple_average():
    a = pd.Series({ts("2020-02-01"): 0.0, ts("2020-03-01"): -0.40})
    b = pd.Series({ts("2020-02-01"): 0.0, ts("2020-03-01"): -0.20})
    out = compute_sector_stats({"A": a, "B": b})
    assert out["worst_month_ret"] == pytest.approx(-0.30)
    assert out["worst_month"] == date(2020, 3, 1)


def test_sector_volatility_of_the_average_series():
    a = monthly_alt(0.04, -0.02, 12)
    b = monthly_alt(0.02, 0.0, 12)
    average = (a + b) / 2
    out = compute_sector_stats({"A": a, "B": b})
    assert out["volatility"] == pytest.approx(average.std(ddof=1) * 12**0.5)


def test_sector_with_one_month_has_null_volatility():
    out = compute_sector_stats({"A": pd.Series({ts("2020-03-01"): -0.40})})
    assert out["worst_month_ret"] == pytest.approx(-0.40) and out["volatility"] is None


def test_sector_without_data_is_all_null():
    assert compute_sector_stats({}) == {
        "worst_month_ret": None,
        "worst_month": None,
        "volatility": None,
    }
