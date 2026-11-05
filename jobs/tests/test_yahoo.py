from datetime import date

import pandas as pd
import pytest

from pipeline.sources import yahoo


class FakeTicker:
    def __init__(self, frame):
        self.frame = frame
        self.kwargs = None

    def history(self, **kwargs):
        self.kwargs = kwargs
        return self.frame


@pytest.fixture
def ticker(monkeypatch):
    fake = FakeTicker(pd.DataFrame())
    monkeypatch.setattr(yahoo.yf, "Ticker", lambda symbol: fake)
    return fake


def frame(days, closes, adj=None, splits=None, dividends=None):
    index = pd.DatetimeIndex(days, tz="America/Sao_Paulo")
    return pd.DataFrame(
        {
            "Close": closes,
            "Adj Close": adj if adj is not None else closes,
            "Stock Splits": splits if splits is not None else [0.0] * len(days),
            "Dividends": dividends if dividends is not None else [0.0] * len(days),
        },
        index=index,
    )


def test_maps_columns_and_strips_timezone(ticker):
    ticker.frame = frame(["2026-10-30"], [10.5], adj=[9.5])
    history = yahoo.fetch_history("PETR4.SA", date(2026, 10, 1), date(2026, 11, 3))
    assert history.prices == [{"date": date(2026, 10, 30), "close": 10.5, "adj_close": 9.5}]


def test_drops_rows_with_nan(ticker):
    ticker.frame = frame(["2026-10-29", "2026-10-30"], [float("nan"), 10.0])
    history = yahoo.fetch_history("PETR4.SA", date(2026, 10, 1), date(2026, 11, 3))
    assert [row["date"] for row in history.prices] == [date(2026, 10, 30)]


def test_drops_rows_with_nan_adjusted_close(ticker):
    ticker.frame = frame(["2026-10-30"], [10.0], adj=[float("nan")])
    assert yahoo.fetch_history("PETR4.SA", None, date(2026, 11, 3)).prices == []


def test_empty_frame_returns_empty_history(ticker):
    history = yahoo.fetch_history("PETR4.SA", None, date(2026, 11, 3))
    assert history.prices == [] and history.splits == []


def test_collects_splits_only_when_nonzero(ticker):
    ticker.frame = frame(["2026-10-29", "2026-10-30"], [10.0, 11.0], splits=[0.0, 4.0])
    history = yahoo.fetch_history("AAPL", None, date(2026, 11, 3))
    assert history.splits == [(date(2026, 10, 30), 4.0)]


def test_collects_dividends_only_when_paid(ticker):
    ticker.frame = frame(["2026-10-29", "2026-10-30"], [10.0, 11.0], dividends=[0.0, 0.85])
    history = yahoo.fetch_history("HGLG11.SA", None, date(2026, 11, 3))
    assert history.dividends == [(date(2026, 10, 30), 0.85)]


def test_passes_auto_adjust_false_and_start(ticker):
    yahoo.fetch_history("PETR4.SA", None, date(2026, 11, 3))
    assert ticker.kwargs["auto_adjust"] is False
    assert ticker.kwargs["actions"] is True
    assert ticker.kwargs["start"] == date(2016, 11, 3)


def test_ten_years_before_a_leap_day():
    assert yahoo.ten_years_before(date(2028, 2, 29)) == date(2018, 2, 28)
