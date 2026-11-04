import os
import secrets
import uuid
from pathlib import Path

import pytest
import requests
from dotenv import load_dotenv

from pipeline import auth_admin

load_dotenv(Path(__file__).resolve().parents[2] / ".env")


class Rest:
    def __init__(self, url, keys):
        self.url = f"{url}/rest/v1"
        self.keys = keys

    def request(self, method, path, key, token=None, **kwargs):
        headers = {"apikey": self.keys[key]}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        return requests.request(method, self.url + path, headers=headers, timeout=30, **kwargs)

    def get(self, path, key, token=None):
        return self.request("GET", path, key, token)

    def post(self, path, json, key, token=None):
        return self.request("POST", path, key, token, json=json)

    def patch(self, path, json, key, token=None):
        return self.request("PATCH", path, key, token, json=json)

    def delete(self, path, key, token=None):
        return self.request("DELETE", path, key, token)


@pytest.fixture(scope="module")
def rest():
    url = os.environ.get("SUPABASE_URL")
    secret = os.environ.get("SUPABASE_SECRET_KEY")
    publishable = os.environ.get("SUPABASE_PUBLISHABLE_KEY")
    if not (url and secret and publishable):
        pytest.skip("Supabase variables are not set")
    return Rest(url, {"secret": secret, "publishable": publishable})


SANDBOX_TICKER = "ZZTESTE3"


def _remove_sandbox_asset(rest):
    found = rest.get(f"/assets?select=id&ticker=eq.{SANDBOX_TICKER}", key="secret").json()
    for row in found:
        for table in ("splits", "transactions"):
            rest.delete(f"/{table}?asset_id=eq.{row['id']}", key="secret").raise_for_status()
        rest.delete(f"/assets?id=eq.{row['id']}", key="secret").raise_for_status()


@pytest.fixture(scope="module")
def sandbox_asset(rest):
    asset = {
        "ticker": SANDBOX_TICKER,
        "name": "Teste",
        "class": "acao_br",
        "currency": "BRL",
        "holdable": True,
        "ml_enabled": False,
        "active": False,
    }
    _remove_sandbox_asset(rest)
    try:
        rest.post("/assets", json=asset, key="secret").raise_for_status()
        found = rest.get(f"/assets?select=id&ticker=eq.{SANDBOX_TICKER}", key="secret").json()
        split = {"asset_id": found[0]["id"], "date": "2024-06-01", "ratio": 2}
        rest.post("/splits", json=split, key="secret").raise_for_status()
        yield
    finally:
        _remove_sandbox_asset(rest)


class Tokens(dict):
    """Access tokens by name; `ids` holds the matching user ids."""

    def __init__(self):
        super().__init__()
        self.ids = {}


@pytest.fixture(scope="module")
def users(rest, sandbox_asset):
    tokens = Tokens()
    try:
        for name in ("a", "b"):
            email = f"rls-{uuid.uuid4()}@example.com"
            password = secrets.token_urlsafe(24)
            tokens.ids[name] = auth_admin.create_user(email, password)
            tokens[name] = auth_admin.sign_in(email, password)
        yield tokens
    finally:
        for user_id in tokens.ids.values():
            auth_admin.delete_user(user_id)
