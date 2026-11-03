from datetime import date, timedelta

import pytest

from pipeline.validate import repair_adjusted_close, validate_prices


def d(n):
    return date(2026, 1, 1) + timedelta(days=n)


def row(day, close):
    return {"date": day, "close": close, "adj_close": close}


def test_accepts_normal_prices():
    ok, bad = validate_prices([row(d(1), 10), row(d(2), 11)], None, set(), set())
    assert len(ok) == 2 and bad == []


@pytest.mark.parametrize("price", [0, -1])
def test_rejects_non_positive(price):
    ok, bad = validate_prices([row(d(1), price)], None, set(), set())
    assert ok == [] and bad[0].date == d(1)


def test_rejects_non_positive_adjusted_close():
    bad_row = {"date": d(1), "close": 10.0, "adj_close": 0.0}
    ok, bad = validate_prices([bad_row], None, set(), set())
    assert ok == [] and bad[0].date == d(1)


def test_rejects_jump_over_50_percent_against_previous_close():
    ok, bad = validate_prices([row(d(1), 15.1)], 10.0, set(), set())
    assert ok == [] and "50%" in bad[0].reason


def test_accepts_exactly_50_percent():
    ok, _ = validate_prices([row(d(1), 15.0)], 10.0, set(), set())
    assert len(ok) == 1


def test_rejects_drop_over_50_percent():
    ok, _ = validate_prices([row(d(1), 4.9)], 10.0, set(), set())
    assert ok == []


def test_split_date_is_exempt():
    ok, _ = validate_prices([row(d(1), 5.0 - 1)], 10.0, {d(1)}, set())
    assert len(ok) == 1


def test_released_date_is_exempt():
    ok, _ = validate_prices([row(d(1), 30)], 10.0, set(), {d(1)})
    assert len(ok) == 1


def test_compares_with_last_accepted_not_with_rejected():
    ok, bad = validate_prices([row(d(1), 100), row(d(2), 11)], 10.0, set(), set())
    assert [r["date"] for r in ok] == [d(2)] and [b.date for b in bad] == [d(1)]


def test_released_date_still_rejects_non_positive():
    ok, _ = validate_prices([row(d(1), 0)], 10.0, set(), {d(1)})
    assert ok == []


def priced(day, close, adj_close):
    return {"date": day, "close": close, "adj_close": adj_close}


def test_repair_removes_false_step_in_adjustment():
    rows = [priced(d(1), 110.0, 13.75), priced(d(2), 110.0, 13.75), priced(d(3), 110.0, 110.0)]
    repaired = repair_adjusted_close(rows)
    assert [r["adj_close"] for r in repaired] == pytest.approx([110.0, 110.0, 110.0])
    assert rows[0]["adj_close"] == 13.75


def test_repair_keeps_normal_dividend_steps():
    rows = [priced(d(1), 100.0, 90.0), priced(d(2), 100.0, 99.0), priced(d(3), 100.0, 100.0)]
    assert repair_adjusted_close(rows) == rows


def test_repair_keeps_earlier_dividends_when_removing_a_step():
    rows = [priced(d(1), 100.0, 9.0), priced(d(2), 100.0, 10.0), priced(d(3), 100.0, 100.0)]
    repaired = repair_adjusted_close(rows)
    assert [r["adj_close"] for r in repaired] == pytest.approx([90.0, 100.0, 100.0])


def test_repair_handles_false_step_downwards():
    rows = [priced(d(1), 100.0, 100.0), priced(d(2), 100.0, 25.0)]
    assert repair_adjusted_close(rows)[0]["adj_close"] == pytest.approx(25.0)


def test_repair_of_empty_list():
    assert repair_adjusted_close([]) == []


@pytest.mark.parametrize("price", [float("nan"), float("inf")])
def test_rejects_non_finite_close(price):
    ok, bad = validate_prices([row(d(1), price)], None, set(), set())
    assert ok == [] and bad[0].date == d(1)


def test_non_finite_adjusted_close_does_not_become_the_previous_close():
    rows = [{"date": d(1), "close": 10.0, "adj_close": float("nan")}, row(d(2), 11.0)]
    ok, bad = validate_prices(rows, 10.0, set(), set())
    assert [r["date"] for r in ok] == [d(2)] and [b.date for b in bad] == [d(1)]


def test_nan_close_does_not_disable_the_next_comparison():
    ok, _ = validate_prices([row(d(1), float("nan")), row(d(2), 500.0)], 10.0, set(), set())
    assert ok == []
