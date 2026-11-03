from datetime import date, timedelta
from itertools import pairwise

import pytest
import requests

from pipeline.sources.bcb import SERIES, fetch_series, year_windows


class FakeResponse:
    def __init__(self, status_code, body):
        self.status_code = status_code
        self.body = body

    def json(self):
        return self.body

    def raise_for_status(self):
        if self.status_code >= 400:
            raise requests.HTTPError(str(self.status_code))


class FakeHttp:
    def __init__(self):
        self.status = 200
        self.json = []
        self.raises = None
        self.calls = 0
        self.params = None

    def get(self, url, params=None, timeout=None):
        self.calls += 1
        self.params = params
        if self.raises:
            raise self.raises("fail")
        return FakeResponse(self.status, self.json)


@pytest.fixture
def http(monkeypatch):
    fake = FakeHttp()
    monkeypatch.setattr(requests, "get", fake.get)
    monkeypatch.setattr("time.sleep", lambda seconds: None)
    return fake


def test_series_codes():
    assert SERIES == {"selic": 11, "cdi": 12, "ipca": 433}


def test_windows_cover_range_without_overlap():
    w = year_windows(date(2016, 3, 10), date(2018, 3, 12))
    assert w[0][0] == date(2016, 3, 10) and w[-1][1] == date(2018, 3, 12)
    assert all(b[0] == a[1] + timedelta(days=1) for a, b in pairwise(w))
    assert all((e - s).days <= 366 for s, e in w)


def test_windows_of_a_single_day():
    day = date(2026, 1, 1)
    assert year_windows(day, day) == [(day, day)]


def test_parses_brazilian_date_and_decimal_point(http):
    http.json = [{"data": "30/10/2026", "valor": "0.050788"}]
    day = date(2026, 10, 30)
    assert fetch_series(12, day, day) == [(day, 0.050788)]


def test_formats_dates_in_request(http):
    fetch_series(12, date(2026, 1, 2), date(2026, 1, 3))
    assert http.params["dataInicial"] == "02/01/2026" and http.params["dataFinal"] == "03/01/2026"


def test_window_without_data_is_empty(http):
    http.status = 404
    assert fetch_series(433, date(2026, 11, 1), date(2026, 11, 2)) == []


def test_timeout_retries_then_raises(http):
    http.raises = requests.Timeout
    with pytest.raises(requests.Timeout):
        fetch_series(12, date(2026, 1, 1), date(2026, 1, 2))
    assert http.calls == 3


def test_server_error_retries_then_raises(http):
    http.status = 503
    with pytest.raises(requests.HTTPError):
        fetch_series(12, date(2026, 1, 1), date(2026, 1, 2))
    assert http.calls == 3


def test_client_error_raises_without_retry(http):
    http.status = 406
    with pytest.raises(requests.HTTPError):
        fetch_series(12, date(2026, 1, 1), date(2026, 1, 2))
    assert http.calls == 1


def test_monthly_series_drops_dates_before_the_window(http):
    # The API also returns the first day of the month that contains the window start.
    http.json = [{"data": "01/11/2017", "valor": "0.28"}, {"data": "01/12/2017", "valor": "0.44"}]
    rows = fetch_series(433, date(2017, 11, 4), date(2018, 11, 4))
    assert rows == [(date(2017, 12, 1), 0.44)]
