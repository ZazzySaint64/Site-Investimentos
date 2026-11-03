"""Tesouro Direto prices from the Tesouro Transparente spreadsheet."""

import csv
import io
from dataclasses import dataclass
from datetime import date, datetime

from pipeline.catalog import Asset
from pipeline.sources.http import get_with_retry
from pipeline.sources.yahoo import ten_years_before
from pipeline.validate import PriceRow

URL = (
    "https://www.tesourotransparente.gov.br/ckan/dataset/df56aa42-484a-4a59-8184-7676580c81e3"
    "/resource/796d2059-14e9-44e3-80c9-2d9e30b405c1/download/PrecoTaxaTesouroDireto.csv"
)
TIMEOUT_SECONDS = 120
REQUIRED_COLUMNS = ("Tipo Titulo", "Data Vencimento", "Data Base", "PU Base Manha")
PREFIXES = {
    "Tesouro Selic": "SELIC",
    "Tesouro IPCA+": "IPCA",
    "Tesouro IPCA+ com Juros Semestrais": "IPCAJ",
    "Tesouro Prefixado": "PRE",
    "Tesouro Prefixado com Juros Semestrais": "PREJ",
    "Tesouro IGPM+ com Juros Semestrais": "IGPMJ",
    "Tesouro Renda+ Aposentadoria Extra": "RENDA",
    "Tesouro Educa+": "EDUCA",
}


@dataclass
class TesouroData:
    assets: list[Asset]
    prices: dict[str, list[PriceRow]]
    skipped: list[str]


def _parse_date(text: str) -> date:
    return datetime.strptime(text, "%d/%m/%Y").date()


def parse_csv(text: str, today: date) -> TesouroData:
    reader = csv.DictReader(io.StringIO(text), delimiter=";")
    missing = [column for column in REQUIRED_COLUMNS if column not in (reader.fieldnames or [])]
    if missing:
        raise ValueError(f"Tesouro spreadsheet without columns: {', '.join(missing)}")

    skipped = []
    unknown_types = set()
    rows = []
    for line in reader:
        kind = line["Tipo Titulo"]
        if kind not in PREFIXES:
            if kind not in unknown_types:
                unknown_types.add(kind)
                skipped.append(f"tipo desconhecido: {kind}")
            continue
        try:
            rows.append((kind, _parse_date(line["Data Vencimento"]), _parse_date(line["Data Base"]),
                         line["PU Base Manha"]))
        except (ValueError, TypeError):
            skipped.append(f"data inválida: {kind} {line['Data Vencimento']} {line['Data Base']}")

    latest = max((base for _, _, base, _ in rows), default=None)
    current = {(kind, maturity) for kind, maturity, base, _ in rows
               if base == latest and maturity > today}
    oldest = ten_years_before(today)

    by_date: dict[tuple[str, date], dict[date, PriceRow]] = {}
    for kind, maturity, base, raw_price in rows:
        if (kind, maturity) not in current or base < oldest:
            continue
        try:
            price = float(raw_price.replace(",", "."))
        except (ValueError, AttributeError):
            skipped.append(f"preço inválido: {kind} {maturity} {base}")
            continue
        by_date.setdefault((kind, maturity), {})[base] = {
            "date": base, "close": price, "adj_close": price,
        }

    assets, prices = [], {}
    for (kind, maturity), series in sorted(by_date.items()):
        ticker = f"TD-{PREFIXES[kind]}-{maturity:%Y%m%d}"
        assets.append(
            Asset(
                ticker=ticker,
                name=f"{kind} {maturity.year}",
                asset_class="tesouro",
                currency="BRL",
                sector="Renda fixa",
                ml_enabled=False,
                maturity=maturity,
            )
        )
        prices[ticker] = [series[day] for day in sorted(series)]
    return TesouroData(assets, prices, skipped)


def fetch_tesouro(today: date) -> TesouroData:
    response = get_with_retry(URL, TIMEOUT_SECONDS)
    response.raise_for_status()
    return parse_csv(response.content.decode("utf-8-sig"), today)
