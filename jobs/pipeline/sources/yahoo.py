"""Yahoo Finance prices. Close already comes adjusted for splits (see docs/fase-0-relatorio.md)."""

from dataclasses import dataclass
from datetime import date, timedelta

import pandas as pd
import yfinance as yf

from pipeline.validate import PriceRow


@dataclass
class History:
    prices: list[PriceRow]
    splits: list[tuple[date, float]]


def ten_years_before(today: date) -> date:
    return (pd.Timestamp(today) - pd.DateOffset(years=10)).date()


def fetch_history(symbol: str, start: date | None, today: date) -> History:
    frame = yf.Ticker(symbol).history(
        start=start or ten_years_before(today),
        end=today + timedelta(days=1),
        auto_adjust=False,
        actions=True,
    )
    if frame.empty:
        return History([], [])
    events = frame.loc[frame["Stock Splits"] > 0, "Stock Splits"]
    complete = frame.dropna(subset=["Close", "Adj Close"])
    return History(
        prices=[
            {"date": ts.date(), "close": float(close), "adj_close": float(adj_close)}
            for ts, close, adj_close in zip(complete.index, complete["Close"], complete["Adj Close"])
        ],
        splits=[(ts.date(), float(ratio)) for ts, ratio in events.items()],
    )
