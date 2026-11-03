"""Banco Central SGS API. Long windows fail or take too long, so requests span one year at most."""

from datetime import date, datetime, timedelta

from pipeline.sources.http import get_with_retry

SERIES = {"selic": 11, "cdi": 12, "ipca": 433}
URL = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.{code}/dados"
TIMEOUT_SECONDS = 60
HTTP_NO_DATA = 404


def year_windows(start: date, end: date) -> list[tuple[date, date]]:
    windows = []
    while start <= end:
        window_end = min(start + timedelta(days=365), end)
        windows.append((start, window_end))
        start = window_end + timedelta(days=1)
    return windows


def fetch_series(code: int, start: date, end: date) -> list[tuple[date, float]]:
    params = {
        "formato": "json",
        "dataInicial": start.strftime("%d/%m/%Y"),
        "dataFinal": end.strftime("%d/%m/%Y"),
    }
    response = get_with_retry(URL.format(code=code), TIMEOUT_SECONDS, params)
    if response.status_code == HTTP_NO_DATA:
        return []
    response.raise_for_status()
    return [
        (datetime.strptime(item["data"], "%d/%m/%Y").date(), float(item["valor"]))
        for item in response.json()
    ]
