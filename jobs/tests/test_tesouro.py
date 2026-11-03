from datetime import date

import pytest
import requests

from pipeline.sources.tesouro import fetch_tesouro, parse_csv

HEADER = (
    "Tipo Titulo;Data Vencimento;Data Base;Taxa Compra Manha;Taxa Venda Manha;"
    "PU Compra Manha;PU Venda Manha;PU Base Manha\n"
)
LINE = "Tesouro Selic;01/03/2029;30/10/2026;0,06;0,07;20185,67;20170,66;20170,66\n"
TODAY = date(2026, 11, 3)


def test_parses_real_line():
    data = parse_csv(HEADER + LINE, TODAY)
    asset = data.assets[0]
    assert asset.ticker == "TD-SELIC-20290301"
    assert asset.name == "Tesouro Selic 2029"
    assert asset.maturity == date(2029, 3, 1)
    assert (asset.asset_class, asset.currency, asset.sector) == ("tesouro", "BRL", "Renda fixa")
    assert asset.ml_enabled is False
    assert data.prices["TD-SELIC-20290301"] == [
        {"date": date(2026, 10, 30), "close": 20170.66, "adj_close": 20170.66}
    ]


@pytest.mark.parametrize(
    "kind,prefix",
    [
        ("Tesouro IPCA+", "IPCA"),
        ("Tesouro IPCA+ com Juros Semestrais", "IPCAJ"),
        ("Tesouro Prefixado", "PRE"),
        ("Tesouro Prefixado com Juros Semestrais", "PREJ"),
        ("Tesouro IGPM+ com Juros Semestrais", "IGPMJ"),
        ("Tesouro Renda+ Aposentadoria Extra", "RENDA"),
        ("Tesouro Educa+", "EDUCA"),
    ],
)
def test_ticker_prefixes(kind, prefix):
    line = f"{kind};15/05/2035;30/10/2026;0,06;0,07;1,0;1,0;1,0\n"
    assert parse_csv(HEADER + line, TODAY).assets[0].ticker == f"TD-{prefix}-20350515"


def test_expired_title_is_excluded():
    line = "Tesouro Selic;01/03/2026;30/10/2026;0,06;0,07;1,0;1,0;1,0\n"
    assert parse_csv(HEADER + line, TODAY).assets == []


def test_title_missing_from_latest_date_is_excluded():
    old = "Tesouro Selic;01/03/2031;29/10/2026;0,06;0,07;1,0;1,0;1,0\n"
    assert [a.ticker for a in parse_csv(HEADER + LINE + old, TODAY).assets] == ["TD-SELIC-20290301"]


def test_prices_older_than_ten_years_are_excluded():
    old = "Tesouro Selic;01/03/2029;02/11/2016;0,06;0,07;1,0;1,0;1,0\n"
    edge = "Tesouro Selic;01/03/2029;03/11/2016;0,06;0,07;1,0;1,0;1,0\n"
    prices = parse_csv(HEADER + LINE + old + edge, TODAY).prices["TD-SELIC-20290301"]
    assert [row["date"] for row in prices] == [date(2016, 11, 3), date(2026, 10, 30)]


def test_repeated_date_keeps_one_row():
    data = parse_csv(HEADER + LINE + LINE, TODAY)
    assert len(data.prices["TD-SELIC-20290301"]) == 1


def test_unknown_type_is_skipped_and_reported():
    line = "Tesouro Novo;01/03/2029;30/10/2026;0,06;0,07;1,0;1,0;1,0\n"
    data = parse_csv(HEADER + LINE + line, TODAY)
    assert len(data.assets) == 1 and any("Tesouro Novo" in s for s in data.skipped)


def test_blank_price_is_skipped_and_reported():
    line = "Tesouro Selic;01/03/2029;29/10/2026;0,06;0,07;;;\n"
    data = parse_csv(HEADER + LINE + line, TODAY)
    assert len(data.prices["TD-SELIC-20290301"]) == 1 and data.skipped


def test_title_with_only_blank_prices_has_no_asset():
    line = "Tesouro Selic;01/03/2029;30/10/2026;0,06;0,07;;;\n"
    data = parse_csv(HEADER + line, TODAY)
    assert data.assets == [] and data.prices == {} and data.skipped


def test_invalid_date_is_skipped_and_reported():
    line = "Tesouro Selic;01/03/2029;xx/10/2026;0,06;0,07;1,0;1,0;1,0\n"
    data = parse_csv(HEADER + LINE + line, TODAY)
    assert len(data.assets) == 1 and data.skipped


def test_missing_column_raises():
    with pytest.raises(ValueError, match="PU Base Manha"):
        parse_csv("Tipo Titulo;Data Vencimento;Data Base\n", TODAY)


def test_fetch_decodes_and_retries(monkeypatch):
    class Response:
        status_code = 200
        content = (HEADER + LINE).encode("utf-8")

        def raise_for_status(self):
            pass

    outcomes = [requests.Timeout("slow"), Response()]
    timeouts = []

    def fake_get(url, params=None, timeout=None):
        timeouts.append(timeout)
        outcome = outcomes.pop(0)
        if isinstance(outcome, Exception):
            raise outcome
        return outcome

    monkeypatch.setattr(requests, "get", fake_get)
    monkeypatch.setattr("time.sleep", lambda seconds: None)
    assert fetch_tesouro(TODAY).assets[0].ticker == "TD-SELIC-20290301"
    assert timeouts == [120, 120]


@pytest.mark.parametrize(
    "line",
    [
        "Tesouro Selic;01/03/2029;29/10/2026;0,06;0,07;;\n",
        "Tesouro Selic;01/03/2029\n",
    ],
)
def test_short_line_is_skipped_and_reported(line):
    data = parse_csv(HEADER + LINE + line, TODAY)
    assert len(data.prices["TD-SELIC-20290301"]) == 1 and data.skipped
