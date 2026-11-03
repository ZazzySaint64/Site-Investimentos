"""Price checks. Pure functions: nothing here touches the network or the database."""

import math
from dataclasses import dataclass
from datetime import date
from typing import TypedDict

MAX_DAILY_CHANGE = 0.5
MAX_FACTOR_STEP = 2.0


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
        day, close, adj_close = row["date"], row["close"], row["adj_close"]
        if not (math.isfinite(close) and math.isfinite(adj_close) and close > 0 and adj_close > 0):
            rejected.append(Rejection(day, "preço zero, negativo ou inválido"))
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


def repair_adjusted_close(rows: list[PriceRow]) -> list[PriceRow]:
    """Removes false steps in the adjustment factor, keeping the most recent prices as they are.

    Yahoo computes the factor from its own quotes, so a dividend paid on a day with a bad quote
    can scale all the earlier history. A real dividend does not cut the factor by half.
    """
    repaired = [dict(row) for row in rows]
    scale = 1.0
    for later, earlier in zip(reversed(rows[1:]), reversed(repaired[:-1])):
        step = (later["adj_close"] / later["close"]) / (earlier["adj_close"] / earlier["close"])
        if step > MAX_FACTOR_STEP or step < 1 / MAX_FACTOR_STEP:
            scale *= step
        earlier["adj_close"] *= scale
    return repaired
