"""Asset catalog: which assets the job tracks and how they map to the database and Yahoo."""

import csv
from dataclasses import dataclass
from datetime import date
from pathlib import Path

CATALOG_PATH = Path(__file__).resolve().parents[1] / "catalog" / "assets.csv"
RELEASED_PATH = Path(__file__).resolve().parents[1] / "catalog" / "released_prices.csv"
CLASSES = {"acao_br", "fii", "acao_eua", "cripto", "tesouro", "indice"}


@dataclass(frozen=True)
class Asset:
    ticker: str
    name: str
    asset_class: str
    currency: str
    sector: str | None
    ml_enabled: bool
    holdable: bool = True
    maturity: date | None = None


def load_catalog(path: Path = CATALOG_PATH) -> list[Asset]:
    assets = []
    with path.open(encoding="utf-8", newline="") as file:
        for row in csv.DictReader(file):
            if row["class"] not in CLASSES:
                raise ValueError(f"unknown class {row['class']} for {row['ticker']}")
            assets.append(
                Asset(
                    ticker=row["ticker"],
                    name=row["name"],
                    asset_class=row["class"],
                    currency=row["currency"],
                    sector=row["sector"] or None,
                    ml_enabled=row["ml_enabled"] == "true",
                    holdable=row["class"] != "indice",
                )
            )
    return assets


def load_released(path: Path = RELEASED_PATH) -> set[tuple[str, date]]:
    with path.open(encoding="utf-8", newline="") as file:
        return {(row["ticker"], date.fromisoformat(row["date"])) for row in csv.DictReader(file)}


def yahoo_symbol(asset: Asset) -> str:
    return f"{asset.ticker}.SA" if asset.asset_class in ("acao_br", "fii") else asset.ticker


def asset_row(asset: Asset) -> dict:
    return {
        "ticker": asset.ticker,
        "name": asset.name,
        "class": asset.asset_class,
        "currency": asset.currency,
        "sector": asset.sector,
        "maturity": asset.maturity,
        "holdable": asset.holdable,
        "ml_enabled": asset.ml_enabled,
        "active": True,
    }
