import pytest

from pipeline.catalog import Asset, asset_row, load_catalog, yahoo_symbol


def test_catalog_counts():
    assets = load_catalog()
    assert sum(a.asset_class == "acao_br" for a in assets) == 70
    assert sum(a.asset_class == "fii" for a in assets) == 30
    assert sum(a.ml_enabled and a.asset_class == "acao_br" for a in assets) == 20
    assert sum(a.ml_enabled and a.asset_class == "fii" for a in assets) == 5


def test_tickers_are_unique():
    tickers = [a.ticker for a in load_catalog()]
    assert len(tickers) == len(set(tickers))


def test_load_rejects_unknown_class(tmp_path):
    p = tmp_path / "a.csv"
    p.write_text(
        "ticker,name,class,currency,sector,ml_enabled\nX,X,etf,BRL,,false\n", encoding="utf-8"
    )
    with pytest.raises(ValueError, match="etf"):
        load_catalog(p)


def test_yahoo_symbol():
    petr = Asset("PETR4", "Petrobras", "acao_br", "BRL", "Petróleo e gás", True)
    assert yahoo_symbol(petr) == "PETR4.SA"
    bvsp = Asset("^BVSP", "Ibovespa", "indice", "BRL", None, False, holdable=False)
    assert yahoo_symbol(bvsp) == "^BVSP"


def test_index_is_not_holdable():
    assert next(a for a in load_catalog() if a.ticker == "^BVSP").holdable is False


def test_index_has_no_sector():
    assert next(a for a in load_catalog() if a.ticker == "^BVSP").sector is None


def test_every_stock_and_fund_has_a_known_sector():
    stocks = {"Bancos", "Seguros", "Petróleo e gás", "Mineração", "Siderurgia", "Energia",
              "Saneamento", "Varejo", "Consumo", "Saúde", "Indústria", "Transporte", "Construção",
              "Papel e celulose", "Agronegócio", "Telecom", "Tecnologia", "Educação"}
    funds = {"FII Logística", "FII Shoppings", "FII Lajes", "FII Papel", "FII Híbrido",
             "FII Renda urbana"}
    for asset in load_catalog():
        if asset.asset_class == "acao_br":
            assert asset.sector in stocks, asset.ticker
        if asset.asset_class == "fii":
            assert asset.sector in funds, asset.ticker


def test_asset_row_uses_database_column_names():
    row = asset_row(Asset("PETR4", "Petrobras", "acao_br", "BRL", "Petróleo e gás", True))
    assert row == {
        "ticker": "PETR4",
        "name": "Petrobras",
        "class": "acao_br",
        "currency": "BRL",
        "sector": "Petróleo e gás",
        "maturity": None,
        "holdable": True,
        "ml_enabled": True,
        "active": True,
    }
