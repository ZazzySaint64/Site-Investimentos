"""Supabase REST client. The secret key goes only in the apikey header."""

import json
import math
import os
import time
from datetime import date

import requests

TIMEOUT_SECONDS = 60
RETRY_WAITS = (1, 3)
PAGE_SIZE = 1000

session = requests.Session()


def _clean(value):
    if isinstance(value, float) and not math.isfinite(value):
        return None
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, dict):
        return {key: _clean(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_clean(item) for item in value]
    return value


def _request(method, table, params=None, body=None, prefer=None):
    url = f"{os.environ['SUPABASE_URL']}/rest/v1/{table}"
    headers = {"apikey": os.environ["SUPABASE_SECRET_KEY"], "Content-Type": "application/json"}
    if prefer:
        headers["Prefer"] = prefer
    data = None if body is None else json.dumps(_clean(body), allow_nan=False)
    for wait in (*RETRY_WAITS, None):
        try:
            response = session.request(
                method, url, headers=headers, params=params, data=data, timeout=TIMEOUT_SECONDS
            )
        except (requests.ConnectionError, requests.Timeout):
            if wait is None:
                raise
        else:
            if response.status_code < 500 or wait is None:
                response.raise_for_status()
                return response
        time.sleep(wait)


def upsert(table: str, rows: list[dict], on_conflict: str, batch_size: int = 1000) -> int:
    for start in range(0, len(rows), batch_size):
        batch = rows[start : start + batch_size]
        if any(row.keys() != batch[0].keys() for row in batch):
            raise ValueError(f"rows for {table} have different keys")
        _request(
            "POST",
            table,
            params={"on_conflict": on_conflict},
            body=batch,
            prefer="resolution=merge-duplicates,return=minimal",
        )
    return len(rows)


def select_all(table: str, params: dict[str, str]) -> list[dict]:
    """Pass an order in params: pages without one can repeat or skip rows."""
    rows = []
    while True:
        page_params = {**params, "limit": PAGE_SIZE, "offset": len(rows)}
        page = _request("GET", table, params=page_params).json()
        rows.extend(page)
        if len(page) < PAGE_SIZE:
            return rows


def insert_returning(table: str, row: dict) -> dict:
    return _request("POST", table, body=row, prefer="return=representation").json()[0]


def update(table: str, match: dict[str, str], values: dict) -> None:
    params = {column: f"eq.{value}" for column, value in match.items()}
    _request("PATCH", table, params=params, body=values)
