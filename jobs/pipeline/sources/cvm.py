"""FII monthly and quarterly reports from CVM open data. Values are fractions, as CVM publishes."""

import io
import zipfile
from dataclasses import dataclass
from datetime import date

import pandas as pd

from pipeline.sources.http import get_with_retry

BASE_URL = "https://dados.cvm.gov.br/dados/FII/DOC"
TIMEOUT_SECONDS = 120
MONTHS_KEPT = 13
KEYS = ["CNPJ_Fundo_Classe", "Data_Referencia"]
PAPER = ("CRI", "CRI_CRA", "LCI", "LCI_LCA", "Letras_Hipotecarias", "LIG")
# Part of Direitos_Bens_Imoveis: buildings under construction or built to be sold.
DEVELOPMENT = ("Imoveis_Renda_Construcao", "Imoveis_Venda_Acabados", "Imoveis_Venda_Construcao")
RENTED = "Imóveis para renda acabados"
LEASE_BANDS = {
    "lease_12m": ("Ate_3Meses", "3a6Meses", "6a9Meses", "9a12Meses"),
    "lease_24m": ("12a15Meses", "15a18Meses", "18a21Meses", "21a24Meses"),
    "lease_36m": ("24a27Meses", "27a30Meses", "30a33Meses", "33a36Meses"),
    "lease_over_36m": ("Acima_36Meses",),
    "lease_undetermined": ("Indeterminado",),
}
TOP_SECTORS = 5
DOUBTFUL_VACANCY = 0.8
DOUBTFUL_REVENUE = 0.02


@dataclass
class FiiReports:
    monthly: list[dict]
    quarterly: list[dict]
    missing: list[str]


def _number(frame: pd.DataFrame, column: str) -> pd.Series:
    return pd.to_numeric(frame[column], errors="coerce")


def _value(value) -> float | None:
    return None if pd.isna(value) else float(value)


def _latest_version(frame: pd.DataFrame) -> pd.DataFrame:
    """A corrected report is sent again with a higher version. Tables with one row per building
    keep every row of that version."""
    version = _number(frame, "Versao")
    return frame[version == version.groupby([frame[key] for key in KEYS]).transform("max")]


def _funds(geral: pd.DataFrame, tickers: list[str], one_per_month: bool = True) -> pd.DataFrame:
    """CNPJ and date of the catalog FIIs. The ISIN is BR, the ticker's 4 letters, then CTF."""
    isin = geral["Codigo_ISIN"].fillna("")
    by_letters = {ticker[:4]: ticker for ticker in tickers}
    frame = geral.assign(ticker=isin.str[2:6].map(by_letters))
    frame = frame[frame["ticker"].notna() & (isin.str[6:9] == "CTF")]
    if not one_per_month:
        return frame[["ticker", *KEYS]]
    # A fund that adapted to Resolution 175 reports under a new CNPJ: the newest CNPJ wins a month.
    newest = frame.groupby("ticker")["Data_Referencia"].transform("max")
    last_of_cnpj = frame.groupby("CNPJ_Fundo_Classe")["Data_Referencia"].transform("max")
    frame = frame.assign(_current=last_of_cnpj == newest).sort_values("_current")
    frame = frame.drop_duplicates(["ticker", "Data_Referencia"], keep="last")
    return frame[["ticker", *KEYS]]


def parse_monthly(
    geral: pd.DataFrame, assets: pd.DataFrame, extra: pd.DataFrame, tickers: list[str]
) -> list[dict]:
    frame = (
        _funds(_latest_version(geral), tickers)
        .merge(_latest_version(assets), on=KEYS)
        .merge(_latest_version(extra), on=KEYS)
        .sort_values(["ticker", "Data_Referencia"])
        .groupby("ticker")
        .tail(MONTHS_KEPT)
        .reset_index(drop=True)
    )
    total = _number(frame, "Total_Investido")
    development = sum(_number(frame, column).fillna(0) for column in DEVELOPMENT)
    parts = pd.DataFrame(
        {
            "buildings": _number(frame, "Direitos_Bens_Imoveis").fillna(0) - development,
            "development": development,
            "paper": sum(_number(frame, column).fillna(0) for column in PAPER),
            "funds": _number(frame, "FII").fillna(0),
        }
    )
    parts["other"] = total - parts.sum(axis=1)
    shares = parts.clip(lower=0).div(total.where(total > 0), axis=0)
    holders = _number(frame, "Total_Numero_Cotistas")

    return [
        {
            "ticker": frame["ticker"][i],
            "month": date.fromisoformat(frame["Data_Referencia"][i]),
            "book_value": _value(_number(frame, "Valor_Patrimonial_Cotas")[i]),
            "holders": None if pd.isna(holders[i]) else int(holders[i]),
            "admin_fee": _value(_number(frame, "Percentual_Despesas_Taxa_Administracao")[i]),
            "amortization": _value(_number(frame, "Percentual_Amortizacao_Cotas_Mes")[i]),
            **{f"share_{name}": _value(shares[name][i]) for name in shares.columns},
        }
        for i in range(len(frame))
    ]


def _weighted(values: pd.Series, weights: pd.Series) -> float | None:
    usable = values.notna() & weights.notna() & (weights > 0)
    if not usable.any():
        return None
    return float((values[usable] * weights[usable]).sum() / weights[usable].sum())


def _vacancy(rented: pd.DataFrame) -> tuple[float | None, bool]:
    """Physical vacancy, empty area over total area. Doubtful when a building said to be almost
    empty still brings a real part of the revenue: some funds send occupancy in this field."""
    vacancy = _number(rented, "Percentual_Vacancia")
    revenue = _number(rented, "Percentual_Receitas_FII")
    if ((vacancy >= DOUBTFUL_VACANCY) & (revenue >= DOUBTFUL_REVENUE)).any():
        return None, True
    return _weighted(vacancy, _number(rented, "Area")), False


def _quarter(fund, buildings, tenants, extra) -> dict:
    def of(frame):
        return frame[
            (frame["CNPJ_Fundo_Classe"] == fund["CNPJ_Fundo_Classe"])
            & (frame["Data_Referencia"] == fund["Data_Referencia"])
        ]

    rented = of(buildings)
    rented = rented[rented["Classe"] == RENTED]
    contracts = of(extra)
    bands = {
        name: float(
            sum(
                _number(contracts, f"Percentual_Vencimento_Receita_FII_Faixa_{band}")
                .fillna(0)
                .sum()
                for band in parts
            )
        )
        for name, parts in LEASE_BANDS.items()
    }
    # Some funds send every band as zero: that means not reported, never "no contracts".
    reported = sum(bands.values()) > 0
    by_sector = (
        of(tenants)
        .assign(share=lambda frame: _number(frame, "Percentual_Receitas_FII"))
        .groupby("Setor_Atuacao")["share"]
        .sum()
        .sort_values(ascending=False)
    )
    vacancy, doubtful = _vacancy(rented)
    default_rate = _weighted(
        _number(rented, "Percentual_Inadimplencia"), _number(rented, "Percentual_Receitas_FII")
    )
    return {
        "ticker": fund["ticker"],
        "quarter": date.fromisoformat(fund["Data_Referencia"]),
        "buildings": len(rented),
        "vacancy": vacancy,
        "vacancy_doubtful": doubtful,
        # Late payments received in the quarter can make the reported share slightly negative.
        "default_rate": None if default_rate is None else max(default_rate, 0.0),
        **{name: value if reported else None for name, value in bands.items()},
        "tenant_sectors": [
            {"sector": sector.strip(), "share": float(share)}
            for sector, share in by_sector[by_sector > 0].head(TOP_SECTORS).items()
        ],
    }


def parse_quarterly(
    geral: pd.DataFrame,
    buildings: pd.DataFrame,
    tenants: pd.DataFrame,
    extra: pd.DataFrame,
    tickers: list[str],
) -> list[dict]:
    """The latest quarter of each fund. A report without buildings loses to an older one with
    them, because a fund that moved to a new CNPJ may send incomplete reports under both."""
    funds = _funds(_latest_version(geral), tickers, one_per_month=False)
    funds = funds.sort_values("Data_Referencia", ascending=False)
    buildings, tenants, extra = (_latest_version(f) for f in (buildings, tenants, extra))
    rows = []
    for ticker in sorted(funds["ticker"].unique()):
        quarters = [
            _quarter(fund, buildings, tenants, extra)
            for _, fund in funds[funds["ticker"] == ticker].iterrows()
        ]
        rows.append(next((row for row in quarters if row["buildings"]), quarters[0]))
    return rows


def read_zip(content: bytes) -> dict[str, pd.DataFrame]:
    """Each CSV of the archive by its middle name, such as `complemento` or `imovel`."""
    tables = {}
    with zipfile.ZipFile(io.BytesIO(content)) as archive:
        for name in archive.namelist():
            middle = name.rsplit(".", 1)[0].split("_fii_", 1)[1].rsplit("_", 1)[0]
            with archive.open(name) as file:
                tables[middle] = pd.read_csv(file, sep=";", encoding="latin-1", dtype=str)
    return tables


def _download(kind: str, year: int) -> dict[str, pd.DataFrame] | None:
    url = f"{BASE_URL}/INF_{kind.upper()}/DADOS/inf_{kind}_fii_{year}.zip"
    response = get_with_retry(url, TIMEOUT_SECONDS)
    if response.status_code == 404:
        return None
    response.raise_for_status()
    return read_zip(response.content)


def _two_years(kind: str, today: date) -> dict[str, pd.DataFrame]:
    """Last year and this year together, so January still has twelve months behind it."""
    found = [tables for year in (today.year - 1, today.year) if (tables := _download(kind, year))]
    if not found:
        raise ValueError(f"CVM has no {kind} FII report for {today.year - 1} or {today.year}")
    return {
        name: pd.concat([tables[name] for tables in found if name in tables]) for name in found[-1]
    }


def fetch_fii_reports(tickers: list[str], today: date) -> FiiReports:
    monthly = _two_years("mensal", today)
    quarterly = _two_years("trimestral", today)
    monthly_rows = parse_monthly(
        monthly["geral"], monthly["ativo_passivo"], monthly["complemento"], tickers
    )
    quarterly_rows = parse_quarterly(
        quarterly["geral"],
        quarterly["imovel"],
        quarterly["imovel_renda_acabado_inquilino"],
        quarterly["complemento"],
        tickers,
    )
    found = {row["ticker"] for row in monthly_rows}
    return FiiReports(monthly_rows, quarterly_rows, sorted(set(tickers) - found))
