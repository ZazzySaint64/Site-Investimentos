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


@pytest.fixture
def rest():
    url = os.environ.get("SUPABASE_URL")
    secret = os.environ.get("SUPABASE_SECRET_KEY")
    publishable = os.environ.get("SUPABASE_PUBLISHABLE_KEY")
    if not (url and secret and publishable):
        pytest.skip("Supabase variables are not set")
    return Rest(url, {"secret": secret, "publishable": publishable})


@pytest.fixture
def sandbox_asset(rest):
    asset = {
        "ticker": "ZZTESTE3",
        "name": "Teste",
        "class": "acao_br",
        "currency": "BRL",
        "holdable": True,
        "ml_enabled": False,
        "active": False,
    }
    rest.post("/assets?on_conflict=ticker", json=asset, key="secret").raise_for_status()
    asset_id = rest.get("/assets?select=id&ticker=eq.ZZTESTE3", key="secret").json()[0]["id"]
    split = {"asset_id": asset_id, "date": "2024-06-01", "ratio": 2}
    rest.post("/splits", json=split, key="secret").raise_for_status()
    yield
    rest.delete(f"/splits?asset_id=eq.{asset_id}", key="secret")
    rest.delete(f"/transactions?asset_id=eq.{asset_id}", key="secret")
    rest.delete(f"/assets?id=eq.{asset_id}", key="secret")


@pytest.fixture
def users(rest, sandbox_asset):
    created = {}
    tokens = {}
    for name in ("a", "b"):
        email = f"rls-{uuid.uuid4()}@example.com"
        password = secrets.token_urlsafe(24)
        created[name] = auth_admin.create_user(email, password)
        tokens[name] = auth_admin.sign_in(email, password)
    yield tokens
    for user_id in created.values():
        auth_admin.delete_user(user_id)
