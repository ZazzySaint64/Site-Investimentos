"""GET with three attempts, shared by the public data sources."""

import time

import requests

RETRY_WAITS = (1, 3)


def get_with_retry(url: str, timeout: int, params: dict | None = None) -> requests.Response:
    for wait in (*RETRY_WAITS, None):
        try:
            response = requests.get(url, params=params, timeout=timeout)
        except (requests.ConnectionError, requests.Timeout):
            if wait is None:
                raise
        else:
            if response.status_code < 500 or wait is None:
                return response
        time.sleep(wait)
