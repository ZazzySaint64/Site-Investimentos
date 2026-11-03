import json
from datetime import date

import pytest
import requests

from pipeline import db


class FakeResponse:
    def __init__(self, status_code=201, body=None):
        self.status_code = status_code
        self.body = body if body is not None else []

    def json(self):
        return self.body

    def raise_for_status(self):
        if self.status_code >= 400:
            raise requests.HTTPError(str(self.status_code))


class FakeSession:
    def __init__(self, responses=()):
        self.responses = list(responses)
        self.calls = []

    def request(self, method, url, **kwargs):
        self.calls.append({"method": method, "url": url, **kwargs})
        if not self.responses:
            return FakeResponse()
        response = self.responses.pop(0)
        if isinstance(response, Exception):
            raise response
        return response


@pytest.fixture
def session(monkeypatch):
    fake = FakeSession()
    monkeypatch.setattr(db, "session", fake)
    monkeypatch.setattr(db.time, "sleep", lambda seconds: fake.calls.append({"slept": seconds}))
    monkeypatch.setenv("SUPABASE_URL", "https://x.supabase.co")
    monkeypatch.setenv("SUPABASE_SECRET_KEY", "sb_secret_test")
    return fake


def requests_made(session):
    return [call for call in session.calls if "method" in call]


def test_upsert_sends_key_only_in_apikey_header(session):
    db.upsert("prices", [{"x": 1}], "x")
    headers = session.calls[0]["headers"]
    assert headers["apikey"] == "sb_secret_test"
    assert "Authorization" not in headers


def test_upsert_uses_merge_duplicates_and_on_conflict(session):
    db.upsert("prices", [{"x": 1}], "asset_id,date")
    call = session.calls[0]
    assert call["method"] == "POST"
    assert call["url"] == "https://x.supabase.co/rest/v1/prices"
    assert "resolution=merge-duplicates" in call["headers"]["Prefer"]
    assert call["params"]["on_conflict"] == "asset_id,date"


def test_upsert_splits_batches(session):
    rows = [{"x": i} for i in range(2500)]
    assert db.upsert("prices", rows, "x", batch_size=1000) == 2500
    assert len(session.calls) == 3
    assert [len(json.loads(call["data"])) for call in session.calls] == [1000, 1000, 500]


def test_upsert_converts_nan_and_inf_to_null(session):
    db.upsert("t", [{"x": float("nan"), "d": date(2026, 1, 2)}, {"x": float("inf"), "d": None}], "d")
    assert json.loads(session.calls[0]["data"]) == [{"x": None, "d": "2026-01-02"}, {"x": None, "d": None}]


def test_upsert_of_empty_list_makes_no_request(session):
    assert db.upsert("prices", [], "x") == 0
    assert session.calls == []


def test_upsert_rejects_batch_with_different_keys(session):
    with pytest.raises(ValueError):
        db.upsert("prices", [{"x": 1}, {"y": 2}], "x")
    assert session.calls == []


def test_select_all_paginates_until_short_page(session):
    session.responses = [
        FakeResponse(200, [{"id": i} for i in range(1000)]),
        FakeResponse(200, [{"id": i} for i in range(3)]),
    ]
    rows = db.select_all("assets", {"select": "id", "order": "id"})
    assert len(rows) == 1003
    assert [call["params"]["offset"] for call in session.calls] == [0, 1000]
    assert session.calls[0]["params"]["select"] == "id"


def test_insert_returning_gives_the_created_row(session):
    session.responses = [FakeResponse(201, [{"id": 7, "job": "nightly"}])]
    assert db.insert_returning("job_runs", {"job": "nightly"}) == {"id": 7, "job": "nightly"}
    assert "return=representation" in session.calls[0]["headers"]["Prefer"]


def test_update_filters_by_match(session):
    db.update("job_runs", {"id": "7"}, {"status": "success", "details": {"x": float("nan")}})
    call = session.calls[0]
    assert call["method"] == "PATCH"
    assert call["params"] == {"id": "eq.7"}
    assert json.loads(call["data"]) == {"status": "success", "details": {"x": None}}


def test_retries_three_times_on_5xx_then_raises(session):
    session.responses = [FakeResponse(503), FakeResponse(503), FakeResponse(503)]
    with pytest.raises(requests.HTTPError):
        db.upsert("prices", [{"x": 1}], "x")
    assert len(requests_made(session)) == 3
    assert [call["slept"] for call in session.calls if "slept" in call] == [1, 3]


def test_retries_on_connection_error(session):
    session.responses = [requests.ConnectionError("down"), FakeResponse(201)]
    assert db.upsert("prices", [{"x": 1}], "x") == 1
    assert len(requests_made(session)) == 2


def test_does_not_retry_on_4xx(session):
    session.responses = [FakeResponse(400)]
    with pytest.raises(requests.HTTPError):
        db.upsert("prices", [{"x": 1}], "x")
    assert len(session.calls) == 1


def test_delete_sends_filters(session):
    db.delete("prices", {"asset_id": "eq.5", "date": "in.(2026-01-01,2026-01-02)"})
    call = session.calls[0]
    assert call["method"] == "DELETE"
    assert call["params"] == {"asset_id": "eq.5", "date": "in.(2026-01-01,2026-01-02)"}
    assert call["headers"]["apikey"] == "sb_secret_test"
