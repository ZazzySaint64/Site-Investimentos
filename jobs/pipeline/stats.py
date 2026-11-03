"""Portfolio statistics. Pure functions: nothing here touches the database."""

import math
from datetime import date

import pandas as pd

WINDOW_MONTHS = 60
MIN_MONTHS = 12
ZERO_VOLATILITY = 1e-12


def _finite(value) -> float | None:
    value = float(value)
    return value if math.isfinite(value) else None


def _annual_volatility(monthly: pd.Series) -> float:
    return monthly.std(ddof=1) * 12**0.5


def monthly_returns(adj_close: pd.Series, today: date) -> pd.Series:
    complete = adj_close[adj_close.index < pd.Timestamp(today).to_period("M").to_timestamp()]
    month_end = complete.sort_index().groupby(complete.index.to_period("M")).last()
    returns = month_end.pct_change().dropna()
    returns.index = returns.index.to_timestamp()
    return returns


def annualized_cdi(cdi_daily_pct: pd.Series) -> float:
    return (1 + cdi_daily_pct / 100).prod() ** (252 / len(cdi_daily_pct)) - 1


def compute_asset_stats(
    adj_close: pd.Series,
    monthly: pd.Series,
    cdi_daily_pct: pd.Series,
    benchmark_monthly: pd.Series | None,
) -> dict[str, float | None]:
    window = monthly.dropna().sort_index().iloc[-WINDOW_MONTHS:]
    stats = dict.fromkeys(
        ("return_annual", "volatility", "sharpe", "max_drawdown", "corr_benchmark")
    )
    if len(window) < MIN_MONTHS:
        return stats

    window_start = window.index[0]
    window_end = window.index[-1] + pd.offsets.MonthBegin(1)

    return_annual = (1 + window).prod() ** (12 / len(window)) - 1
    volatility = _annual_volatility(window)
    stats["return_annual"] = _finite(return_annual)
    stats["volatility"] = _finite(volatility)

    cdi = cdi_daily_pct[(cdi_daily_pct.index >= window_start) & (cdi_daily_pct.index < window_end)]
    if len(cdi) and volatility > ZERO_VOLATILITY:
        stats["sharpe"] = _finite((return_annual - annualized_cdi(cdi)) / volatility)

    prices = adj_close[adj_close.index >= window_start]
    if len(prices):
        stats["max_drawdown"] = _finite((prices / prices.cummax() - 1).min())

    if benchmark_monthly is not None:
        common = pd.concat([window, benchmark_monthly], axis=1, join="inner").dropna()
        if len(common) >= MIN_MONTHS and common.std(ddof=1).min() > ZERO_VOLATILITY:
            stats["corr_benchmark"] = _finite(common.iloc[:, 0].corr(common.iloc[:, 1]))
    return stats


def compute_sector_stats(monthly_by_asset: dict[str, pd.Series]) -> dict:
    """Uses the whole history: the worst month of a sector is usually an old crisis."""
    empty = {"worst_month_ret": None, "worst_month": None, "volatility": None}
    if not monthly_by_asset:
        return empty
    average = pd.DataFrame(monthly_by_asset).mean(axis=1).dropna()
    if average.empty:
        return empty
    return {
        "worst_month_ret": _finite(average.min()),
        "worst_month": average.idxmin().date(),
        "volatility": _finite(_annual_volatility(average)),
    }
