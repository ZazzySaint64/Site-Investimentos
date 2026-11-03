"""Writes the fictional demo portfolios. Names and purchases are invented; prices are real."""

import csv
import sys
from datetime import UTC, date, datetime, timedelta
from pathlib import Path

from dotenv import load_dotenv

from pipeline import db as default_db

CATALOG_DIR = Path(__file__).resolve().parents[1] / "catalog"
PERSONAS_PATH = CATALOG_DIR / "demo_personas.csv"
TRANSACTIONS_PATH = CATALOG_DIR / "demo_transactions.csv"
MAX_DAYS_WITHOUT_PRICE = 5
QUANTITY_TOLERANCE = 1e-9


def load_personas(path: Path = PERSONAS_PATH) -> list[dict]:
    with path.open(encoding="utf-8", newline="") as file:
        return list(csv.DictReader(file))


def load_transactions(path: Path = TRANSACTIONS_PATH) -> list[dict]:
    with path.open(encoding="utf-8", newline="") as file:
        return [
            {**row, "quantity": float(row["quantity"]), "date": date.fromisoformat(row["date"])}
            for row in csv.DictReader(file)
        ]


def price_paid(close: float, later_ratios: list[float]) -> float:
    """The source already adjusts close for splits, so this undoes it to get the real price."""
    for ratio in later_ratios:
        close *= ratio
    return close


def _later_ratios(splits: list[tuple[date, float]], day: date) -> list[float]:
    return [ratio for split_day, ratio in splits if split_day > day]


def check_positions(rows: list[dict], splits: dict[str, list[tuple[date, float]]]) -> None:
    held: dict[str, float] = {}
    for row in sorted(rows, key=lambda r: (r["date"], r["type"] != "buy")):
        ticker = row["ticker"]
        quantity = row["quantity"]
        for ratio in _later_ratios(splits.get(ticker, []), row["date"]):
            quantity *= ratio
        held[ticker] = held.get(ticker, 0.0) + (quantity if row["type"] == "buy" else -quantity)
        if held[ticker] < -QUANTITY_TOLERANCE:
            raise ValueError(f"{ticker}: sale leaves the position negative on {row['date']}")


def _close_on(db, asset_id: int, ticker: str, day: date) -> float:
    params = {"select": "date,close", "asset_id": f"eq.{asset_id}", "order": "date"}
    known = [row for row in db.select_all("prices", params) if row["date"] <= day.isoformat()]
    if not known:
        raise ValueError(f"{ticker}: no price on or before {day}")
    latest = max(known, key=lambda row: row["date"])
    if day - date.fromisoformat(latest["date"]) > timedelta(days=MAX_DAYS_WITHOUT_PRICE):
        raise ValueError(f"{ticker}: last price before {day} is too old")
    return float(latest["close"])


def seed(db, today: date) -> int:
    personas = load_personas()
    rows = load_transactions()
    slugs = {persona["slug"] for persona in personas}
    assets = {
        asset["ticker"]: asset
        for asset in db.select_all(
            "assets", {"select": "id,ticker,active,holdable", "order": "id"}
        )
    }

    for row in rows:
        asset = assets.get(row["ticker"])
        if row["persona"] not in slugs:
            raise ValueError(f"unknown persona {row['persona']}")
        if asset is None:
            raise ValueError(f"unknown ticker {row['ticker']}")
        if not (asset["active"] and asset["holdable"]):
            raise ValueError(f"{row['ticker']} is inactive or cannot be held")
        if row["date"] > today:
            raise ValueError(f"{row['ticker']}: future date {row['date']}")

    splits: dict[str, list[tuple[date, float]]] = {}
    for ticker in {row["ticker"] for row in rows}:
        params = {"select": "date,ratio", "asset_id": f"eq.{assets[ticker]['id']}", "order": "date"}
        splits[ticker] = [
            (date.fromisoformat(split["date"]), float(split["ratio"]))
            for split in db.select_all("splits", params)
        ]
    for slug in slugs:
        check_positions([row for row in rows if row["persona"] == slug], splits)

    transactions = [
        (
            row,
            round(
                price_paid(
                    _close_on(db, assets[row["ticker"]]["id"], row["ticker"], row["date"]),
                    _later_ratios(splits[row["ticker"]], row["date"]),
                ),
                6,
            ),
        )
        for row in rows
    ]

    db.upsert("demo_personas", personas, "slug")
    persona_ids = {
        persona["slug"]: persona["id"]
        for persona in db.select_all("demo_personas", {"select": "id,slug", "order": "id"})
    }
    return db.upsert(
        "demo_transactions",
        [
            {
                "persona_id": persona_ids[row["persona"]],
                "asset_id": assets[row["ticker"]]["id"],
                "type": row["type"],
                "quantity": row["quantity"],
                "price": price,
                "date": row["date"],
            }
            for row, price in transactions
        ],
        "persona_id,asset_id,type,date",
    )


def main() -> int:
    load_dotenv(Path(__file__).resolve().parents[2] / ".env")
    count = seed(default_db, datetime.now(UTC).date())
    print(f"{count} transactions saved")
    return 0


if __name__ == "__main__":
    sys.exit(main())
