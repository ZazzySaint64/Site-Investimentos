"""Nightly job: updates assets, macro series, prices and statistics, isolating failures by asset."""

import argparse
import sys
import time
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import UTC, date, datetime, timedelta
from pathlib import Path
from typing import Any

import pandas as pd
from dotenv import load_dotenv

from pipeline import db as default_db
from pipeline import stats
from pipeline.catalog import (
    Asset,
    asset_row,
    load_catalog,
    load_history_starts,
    load_released,
    yahoo_symbol,
)
from pipeline.sources.bcb import SERIES, fetch_series, year_windows
from pipeline.sources.tesouro import TesouroData, fetch_tesouro
from pipeline.sources.yahoo import History, fetch_history, ten_years_before
from pipeline.validate import repair_adjusted_close, validate_prices

OVERLAP_DAYS = 5
SECONDS_BETWEEN_ASSETS = 0.2
FAILED_SHARE = 0.10
# Yahoo rescales past adjusted closes after a dividend, so a difference in the overlap means that
# the saved adjusted history is stale. The tolerance absorbs rounding of the numeric(18,6) column.
ADJUSTMENT_TOLERANCE = 0.0005
STATS_EXCLUDED_CLASSES = ("tesouro", "indice")
DELETE_BATCH_SIZE = 200


@dataclass
class Deps:
    fetch_history: Callable
    fetch_series: Callable
    fetch_tesouro: Callable
    catalog: list[Asset]
    db: Any


@dataclass
class RunResult:
    status: str
    failed: list[str] = field(default_factory=list)
    rejected: list[dict] = field(default_factory=list)
    skipped: list[str] = field(default_factory=list)


def _series(rows: list[dict], value_column: str, date_column: str = "date") -> pd.Series:
    dates = pd.DatetimeIndex([row[date_column] for row in rows])
    return pd.Series([float(row[value_column]) for row in rows], index=dates, dtype=float)


def _write_assets(deps, tesouro, tickers) -> dict[str, dict]:
    listed = deps.catalog + (tesouro.assets if tesouro else [])
    deps.db.upsert("assets", [asset_row(asset) for asset in listed], "ticker")
    saved = deps.db.select_all("assets", {"select": "id,ticker,class,sector,active", "order": "id"})
    if tickers is None:
        known = {asset.ticker for asset in listed}
        for asset in saved:
            title_unverified = asset["class"] == "tesouro" and tesouro is None
            if asset["active"] and asset["ticker"] not in known and not title_unverified:
                deps.db.update("assets", {"id": str(asset["id"])}, {"active": False})
                asset["active"] = False
    return {asset["ticker"]: asset for asset in saved}


def _write_macro(deps, today) -> list[str]:
    failed = []
    for name, code in SERIES.items():
        try:
            params = {"select": "date", "series": f"eq.{name}", "order": "date"}
            saved = deps.db.select_all("macro_series", params)
            start = (
                date.fromisoformat(saved[-1]["date"]) - timedelta(days=OVERLAP_DAYS)
                if saved
                else ten_years_before(today)
            )
            rows = []
            for window_start, window_end in year_windows(start, today):
                rows += [
                    {"series": name, "date": day, "value": value}
                    for day, value in deps.fetch_series(code, window_start, window_end)
                ]
            deps.db.upsert("macro_series", rows, "series,date")
        except Exception as exc:
            print(f"macro {name} failed: {exc}", file=sys.stderr)
            failed.append(f"macro:{name}")
    return failed


def _load_saved_prices(deps, asset_id) -> dict[date, dict]:
    params = {"select": "date,close,adj_close", "asset_id": f"eq.{asset_id}", "order": "date"}
    return {date.fromisoformat(row["date"]): row for row in deps.db.select_all("prices", params)}


def _adjustment_changed(history: History, saved: dict[date, dict]) -> bool:
    latest = max(saved)  # may have been saved as a partial bar during trading hours
    for row in history.prices:
        stored = saved.get(row["date"])
        if stored and row["date"] != latest and abs(row["adj_close"] / float(stored["adj_close"]) - 1) > ADJUSTMENT_TOLERANCE:
            return True
    return False


def _market_history(deps, asset, asset_id, saved, today, full, cut) -> tuple[History, date | None]:
    def fetch(start):
        history = deps.fetch_history(yahoo_symbol(asset), start, today)
        if cut is None:
            return history
        return History(
            [row for row in history.prices if row["date"] >= cut],
            [split for split in history.splits if split[0] >= cut],
        )

    start = None if full or not saved else max(saved) - timedelta(days=OVERLAP_DAYS)
    history = fetch(start)
    if start is not None:
        params = {"select": "date", "asset_id": f"eq.{asset_id}", "order": "date"}
        known_splits = {row["date"] for row in deps.db.select_all("splits", params)}
        new_split = any(day.isoformat() not in known_splits for day, _ in history.splits)
        if new_split or _adjustment_changed(history, saved):
            return fetch(None), None
    return history, start


def _tesouro_history(rows, saved, full) -> tuple[History, date | None]:
    if full or not saved:
        return History(rows, []), None
    start = max(saved) - timedelta(days=OVERLAP_DAYS)
    return History([row for row in rows if row["date"] >= start], []), start


def _delete_rows(deps, table, column, asset_id, values) -> None:
    ordered = sorted(values)
    for start in range(0, len(ordered), DELETE_BATCH_SIZE):
        batch = ",".join(ordered[start : start + DELETE_BATCH_SIZE])
        deps.db.delete(table, {"asset_id": f"eq.{asset_id}", column: f"in.({batch})"})


def _process_asset(
    deps, asset, asset_id, tesouro, today, full, released, cut, result
) -> tuple[pd.Series | None, bool]:
    """Returns the adjusted closes, and whether the source had nothing for this asset."""
    saved = _load_saved_prices(deps, asset_id)
    removed_rows = False
    if asset.asset_class == "tesouro":
        history, start = _tesouro_history(tesouro.prices[asset.ticker], saved, full)
    else:
        history, start = _market_history(deps, asset, asset_id, saved, today, full, cut)

    has_data = bool(history.prices)
    if has_data:
        before_start = [day for day in saved if start is not None and day < start]
        previous_close = float(saved[max(before_start)]["close"]) if before_start else None
        accepted, rejected = validate_prices(
            history.prices,
            previous_close,
            {day for day, _ in history.splits},
            {day for ticker, day in released if ticker == asset.ticker},
        )
        accepted = repair_adjusted_close(accepted)
        result.rejected += [
            {"ticker": asset.ticker, "date": item.date.isoformat(), "reason": item.reason}
            for item in rejected
        ]
        deps.db.upsert(
            "splits",
            [{"asset_id": asset_id, "date": day, "ratio": ratio} for day, ratio in history.splits],
            "asset_id,date",
        )
        deps.db.upsert(
            "prices", [{"asset_id": asset_id, **row} for row in accepted], "asset_id,date"
        )
        # A refetch replaces the history: rows it left out are on the old scale, or were rejected
        # now, or fell out of the 10-year window. A truncated response keeps them.
        accepted_days = {row["date"] for row in accepted}
        if start is None and saved and accepted_days and max(accepted_days) >= max(saved):
            stale = set(saved) - accepted_days
            _delete_rows(deps, "prices", "date", asset_id, [day.isoformat() for day in stale])
            for day in stale:
                del saved[day]
            removed_rows = bool(stale)
        for row in accepted:
            saved[row["date"]] = row
    else:
        result.skipped.append(f"sem dados novos: {asset.ticker}")

    if not saved:
        return None, not has_data
    adj_close = _series([{"date": day, **saved[day]} for day in sorted(saved)], "adj_close")
    monthly = stats.monthly_returns(adj_close, today)
    deps.db.upsert(
        "monthly_returns",
        [
            {"asset_id": asset_id, "month": month.date(), "ret_local": value, "ret_brl": value}
            for month, value in monthly.items()
        ],
        "asset_id,month",
    )
    if removed_rows:
        params = {"select": "month", "asset_id": f"eq.{asset_id}", "order": "month"}
        known = {row["month"] for row in deps.db.select_all("monthly_returns", params)}
        current = {month.date().isoformat() for month in monthly.index}
        _delete_rows(deps, "monthly_returns", "month", asset_id, known - current)
    return adj_close, not has_data


def _write_stats(deps, assets_by_ticker, adj_close_by_ticker, today) -> None:
    params = {"select": "asset_id,month,ret_local", "order": "asset_id,month"}
    monthly_rows = deps.db.select_all("monthly_returns", params)
    rows_by_asset: dict[int, list[dict]] = {}
    for row in monthly_rows:
        rows_by_asset.setdefault(row["asset_id"], []).append(row)
    monthly_by_id = {
        asset_id: _series(rows, "ret_local", "month") for asset_id, rows in rows_by_asset.items()
    }
    empty = pd.Series(dtype=float, index=pd.DatetimeIndex([]))
    cdi_rows = deps.db.select_all(
        "macro_series", {"select": "date,value", "series": "eq.cdi", "order": "date"}
    )
    cdi = _series(cdi_rows, "value") if cdi_rows else empty
    benchmark_asset = assets_by_ticker.get("^BVSP")
    benchmark = monthly_by_id.get(benchmark_asset["id"]) if benchmark_asset else None

    deps.db.upsert(
        "asset_stats",
        [
            {
                "asset_id": assets_by_ticker[ticker]["id"],
                "as_of": today,
                **stats.compute_asset_stats(
                    adj_close,
                    monthly_by_id.get(assets_by_ticker[ticker]["id"], empty),
                    cdi,
                    benchmark,
                ),
            }
            for ticker, adj_close in adj_close_by_ticker.items()
        ],
        "asset_id",
    )

    by_sector: dict[str, dict[str, pd.Series]] = {}
    for ticker, asset in assets_by_ticker.items():
        monthly = monthly_by_id.get(asset["id"])
        eligible = (
            asset["active"] and asset["sector"] and asset["class"] not in STATS_EXCLUDED_CLASSES
        )
        if eligible and monthly is not None:
            by_sector.setdefault(asset["sector"], {})[ticker] = monthly
    deps.db.upsert(
        "sector_stats",
        [
            {"sector": sector, "as_of": today, **stats.compute_sector_stats(members)}
            for sector, members in by_sector.items()
        ],
        "sector",
    )


def _execute(deps, today, tickers, full, released, history_starts) -> RunResult:
    result = RunResult("success")
    tesouro: TesouroData | None = None
    tesouro_failed = False
    if tickers is None or any(ticker.startswith("TD-") for ticker in tickers):
        try:
            tesouro = deps.fetch_tesouro(today)
            result.skipped += tesouro.skipped
        except Exception as exc:
            print(f"tesouro failed: {exc}", file=sys.stderr)
            tesouro_failed = True
            result.failed.append("tesouro")

    assets_by_ticker = _write_assets(deps, tesouro, tickers)
    macro_failed = _write_macro(deps, today)
    result.failed += macro_failed

    candidates = deps.catalog + (tesouro.assets if tesouro else [])
    if tickers is not None:
        known = {asset.ticker for asset in candidates}
        result.skipped += [f"ticker desconhecido: {t}" for t in tickers if t not in known]
        candidates = [asset for asset in candidates if asset.ticker in tickers]

    failed_assets = []
    without_data = 0
    adj_close_by_ticker = {}
    for asset in candidates:
        try:
            adj_close, empty = _process_asset(
                deps,
                asset,
                assets_by_ticker[asset.ticker]["id"],
                tesouro,
                today,
                full,
                released,
                history_starts.get(asset.ticker),
                result,
            )
            without_data += empty
            if adj_close is not None:
                adj_close_by_ticker[asset.ticker] = adj_close
        except Exception as exc:
            print(f"{asset.ticker} failed: {exc}", file=sys.stderr)
            failed_assets.append(asset.ticker)
        if asset.asset_class != "tesouro":
            time.sleep(SECONDS_BETWEEN_ASSETS)
    result.failed += failed_assets

    _write_stats(deps, assets_by_ticker, adj_close_by_ticker, today)

    # yfinance reports most outages as an empty response, so those count like failures here.
    unavailable = len(failed_assets) + without_data
    too_many = candidates and unavailable >= FAILED_SHARE * len(candidates)
    if tesouro_failed or macro_failed or too_many:
        result.status = "failed"
    elif failed_assets or result.rejected:
        result.status = "partial"
    return result


def run(
    deps: Deps,
    today: date,
    tickers: list[str] | None = None,
    full: bool = False,
    released: set[tuple[str, date]] = frozenset(),
    history_starts: dict[str, date] | None = None,
) -> RunResult:
    job = deps.db.insert_returning("job_runs", {"job": "nightly", "status": "running", "details": {}})

    def close(status: str, details: dict) -> None:
        values = {"status": status, "finished_at": datetime.now(UTC).isoformat(), "details": details}
        deps.db.update("job_runs", {"id": str(job["id"])}, values)

    try:
        result = _execute(deps, today, tickers, full, released, history_starts or {})
    except Exception as exc:
        print(f"nightly failed: {exc}", file=sys.stderr)
        close("failed", {"error": f"{type(exc).__name__}: {exc}"[:500]})
        return RunResult("failed", failed=["job"])
    close(
        result.status,
        {"failed": result.failed, "rejected": result.rejected, "skipped": result.skipped},
    )
    return result


def parse_release(text: str) -> tuple[str, date]:
    ticker, _, day = text.strip().rpartition(":")
    return ticker, date.fromisoformat(day)


def default_deps() -> Deps:
    load_dotenv(Path(__file__).resolve().parents[2] / ".env")
    return Deps(fetch_history, fetch_series, fetch_tesouro, load_catalog(), default_db)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="pipeline.nightly")
    parser.add_argument("--full", action="store_true", help="download the whole history again")
    parser.add_argument("--tickers", help="comma-separated tickers; only these are processed")
    parser.add_argument(
        "--release", help="comma-separated TICKER:AAAA-MM-DD prices to accept despite the 50%% rule"
    )
    args = parser.parse_args(argv)

    tickers = [t.strip() for t in args.tickers.split(",") if t.strip()] if args.tickers else None
    released = load_released()
    if args.release:
        released |= {parse_release(item) for item in args.release.split(",")}
    today = datetime.now(UTC).date()
    result = run(
        default_deps(),
        today,
        tickers=tickers,
        full=args.full,
        released=released,
        history_starts=load_history_starts(),
    )
    print(
        f"status={result.status} failed={len(result.failed)} "
        f"rejected={len(result.rejected)} skipped={len(result.skipped)}"
    )
    for item in result.failed:
        print(f"failed: {item}")
    for item in result.rejected:
        print(f"rejected: {item['ticker']} {item['date']} {item['reason']}")
    return 1 if result.status == "failed" else 0


if __name__ == "__main__":
    sys.exit(main())
