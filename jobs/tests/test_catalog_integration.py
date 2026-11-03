import pytest
import yfinance as yf

from pipeline.catalog import load_catalog, yahoo_symbol


@pytest.mark.integration
def test_every_asset_has_at_least_250_rows_on_yahoo():
    short = {}
    for asset in load_catalog():
        rows = len(yf.Ticker(yahoo_symbol(asset)).history(period="2y", auto_adjust=False))
        if rows < 250:
            short[asset.ticker] = rows
    assert short == {}
