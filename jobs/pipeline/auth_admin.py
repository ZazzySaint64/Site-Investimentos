"""Supabase Auth admin client, used by integration tests. The secret key goes only in apikey."""

import os

import requests

TIMEOUT_SECONDS = 30


def _url(path: str) -> str:
    return f"{os.environ['SUPABASE_URL']}/auth/v1{path}"


def _admin_headers() -> dict[str, str]:
    return {"apikey": os.environ["SUPABASE_SECRET_KEY"]}


def create_user(email: str, password: str, user_id: str | None = None) -> str:
    body = {"email": email, "password": password, "email_confirm": True}
    if user_id:
        body["id"] = user_id
    response = requests.post(
        _url("/admin/users"), headers=_admin_headers(), json=body, timeout=TIMEOUT_SECONDS
    )
    response.raise_for_status()
    return response.json()["id"]


def delete_user(user_id: str) -> None:
    response = requests.delete(
        _url(f"/admin/users/{user_id}"), headers=_admin_headers(), timeout=TIMEOUT_SECONDS
    )
    if response.status_code != 404:
        response.raise_for_status()


def sign_in(email: str, password: str) -> str:
    response = requests.post(
        _url("/token?grant_type=password"),
        headers={"apikey": os.environ["SUPABASE_PUBLISHABLE_KEY"]},
        json={"email": email, "password": password},
        timeout=TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    return response.json()["access_token"]
