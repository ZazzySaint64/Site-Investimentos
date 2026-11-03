import os
from pathlib import Path

import pytest
import requests
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")


class Rest:
    def __init__(self, url, keys):
        self.url = f"{url}/rest/v1"
        self.keys = keys

    def request(self, method, path, key, **kwargs):
        headers = {"apikey": self.keys[key]}
        return requests.request(method, self.url + path, headers=headers, timeout=30, **kwargs)

    def get(self, path, key):
        return self.request("GET", path, key)

    def post(self, path, json, key):
        return self.request("POST", path, key, json=json)

    def delete(self, path, key):
        return self.request("DELETE", path, key)


@pytest.fixture
def rest():
    url = os.environ.get("SUPABASE_URL")
    secret = os.environ.get("SUPABASE_SECRET_KEY")
    publishable = os.environ.get("SUPABASE_PUBLISHABLE_KEY")
    if not (url and secret and publishable):
        pytest.skip("Supabase variables are not set")
    return Rest(url, {"secret": secret, "publishable": publishable})
