from datetime import date, timedelta

import pytest

from pipeline.validate import validate_prices


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
