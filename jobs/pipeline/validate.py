"""Price checks. Pure functions: nothing here touches the network or the database."""

from dataclasses import dataclass
from datetime import date
from typing import TypedDict

MAX_DAILY_CHANGE = 0.5


class PriceRow(TypedDict):
    date: date
    close: float
    adj_close: float


@dataclass(frozen=True)
class Rejection:
    date: date
    reason: str


def validate_prices(
    rows: list[PriceRow],
    previous_close: float | None,
    split_dates: set[date],
    released: set[date],
) -> tuple[list[PriceRow], list[Rejection]]:
    accepted, rejected = [], []
    previous = previous_close
    for row in rows:
        day, close = row["date"], row["close"]
        if close <= 0 or row["adj_close"] <= 0:
            rejected.append(Rejection(day, "preço zero ou negativo"))
            continue
        exempt = day in split_dates or day in released
        if (
            previous is not None
            and not exempt
            and abs(close - previous) > MAX_DAILY_CHANGE * previous
        ):
            rejected.append(Rejection(day, "variação acima de 50% sem desdobramento"))
            continue
        accepted.append(row)
        previous = close
    return accepted, rejected
