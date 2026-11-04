"""Recreates the three e2e test users and writes their credentials to web/.env.local."""

import secrets
from pathlib import Path

from dotenv import load_dotenv

from pipeline import auth_admin

ROOT = Path(__file__).resolve().parents[2]
ENV_LOCAL = ROOT / "web" / ".env.local"
USERS = {
    "A": ("e2e-a@example.com", "00000000-0000-4000-8000-0000000000a1"),
    "B": ("e2e-b@example.com", "00000000-0000-4000-8000-0000000000b2"),
    "C": ("e2e-c@example.com", "00000000-0000-4000-8000-0000000000c3"),
}


def replace_env_lines(text: str, values: dict[str, str]) -> str:
    """Drops the lines that set any of the given keys, then appends the new values."""
    kept = [line for line in text.splitlines() if line.split("=", 1)[0] not in values]
    return "".join(f"{line}\n" for line in [*kept, *(f"{k}={v}" for k, v in values.items())])


def main() -> None:
    load_dotenv(ROOT / ".env")
    values = {}
    for who, (email, user_id) in USERS.items():
        password = secrets.token_urlsafe(18)
        auth_admin.delete_user(user_id)
        auth_admin.create_user(email, password, user_id)
        values[f"E2E_EMAIL_{who}"] = email
        values[f"E2E_PASSWORD_{who}"] = password
    text = ENV_LOCAL.read_text(encoding="utf-8") if ENV_LOCAL.exists() else ""
    ENV_LOCAL.write_text(replace_env_lines(text, values), encoding="utf-8")
    print(f"{len(USERS)} e2e users recreated; credentials written to {ENV_LOCAL.name}")


if __name__ == "__main__":
    main()
