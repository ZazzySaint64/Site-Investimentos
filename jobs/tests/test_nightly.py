from datetime import date, timedelta

import pytest

from pipeline import db as real_db
from pipeline import nightly
from pipeline.catalog import Asset
from pipeline.sources.tesouro import TesouroData
from pipeline.sources.yahoo import History

TODAY = date(2026, 11, 3)


def stock(ticker, sector="Bancos"):
    return Asset(ticker, ticker, "acao_br", "BRL", sector, False)


def row(day, close, adj_close=None):
    return {"date": day, "close": close, "adj_close": close if adj_close is None else adj_close}


def days_back(count, close=100.0):
    return [row(TODAY - timedelta(days=count - i), close) for i in range(count)]


class FakeDb:
    def __init__(self):
        self.tables = {}
        self.next_id = 1
        self.fail_on = None

    def upsert(self, table, rows, on_conflict, batch_size=1000):
        if self.fail_on == table:
            raise RuntimeError(f"{table} is down")
        stored = self.tables.setdefault(table, [])
        columns = on_conflict.split(",")
        keys = [tuple(str(raw[column]) for column in columns) for raw in rows]
        if len(keys) != len(set(keys)):
            raise RuntimeError("ON CONFLICT DO UPDATE cannot affect row a second time")
        for raw in rows:
            clean = real_db._clean(raw)
            key = [clean[column] for column in columns]
            existing = next((r for r in stored if [r[c] for c in columns] == key), None)
            if existing:
                existing.update(clean)
            else:
                if table == "assets":
                    clean = {"id": self.next_id, **clean}
                    self.next_id += 1
                stored.append(clean)
        return len(rows)

    def select_all(self, table, params):
        rows = list(self.tables.get(table, []))
        for column, value in params.items():
            if column in ("select", "order"):
                continue
            rows = [r for r in rows if str(r[column]) == value.removeprefix("eq.")]
        if "order" in params:
            columns = params["order"].split(",")
            rows.sort(key=lambda r: [r[column] for column in columns])
        return [dict(r) for r in rows]

    def delete(self, table, filters):
        def matches(stored):
            for column, value in filters.items():
                if value.startswith("in."):
                    if str(stored[column]) not in value[4:-1].split(","):
                        return False
                elif str(stored[column]) != value.removeprefix("eq."):
                    return False
            return True

        self.tables[table] = [r for r in self.tables.get(table, []) if not matches(r)]

    def insert_returning(self, table, row):
        stored = self.tables.setdefault(table, [])
        created = {"id": len(stored) + 1, **real_db._clean(row)}
        stored.append(created)
        return dict(created)

    def update(self, table, match, values):
        for stored in self.tables[table]:
            if all(str(stored[column]) == value for column, value in match.items()):
                stored.update(real_db._clean(values))


class Fake:
    def __init__(self):
        self.db = FakeDb()
        self.catalog = [stock("A"), stock("B")]
        self.histories = {}
        self.history_calls = []
        self.macro_calls = []
        self.macro_error = None
        self.tesouro = TesouroData([], {}, [])
        self.tesouro_error = None
        self.tesouro_calls = 0

    def fetch_history(self, symbol, start, today):
        self.history_calls.append((symbol, start))
        outcome = self.histories.get(symbol, History(days_back(3), []))
        if callable(outcome):
            outcome = outcome(start)
        if isinstance(outcome, Exception):
            raise outcome
        return outcome

    def fetch_series(self, code, start, end):
        self.macro_calls.append((code, start, end))
        if self.macro_error:
            raise self.macro_error
        return [(end, 0.05)]

    def fetch_tesouro(self, today):
        self.tesouro_calls += 1
        if self.tesouro_error:
            raise self.tesouro_error
        return self.tesouro

    def run(self, **kwargs):
        deps = nightly.Deps(
            fetch_history=self.fetch_history,
            fetch_series=self.fetch_series,
            fetch_tesouro=self.fetch_tesouro,
            catalog=self.catalog,
            db=self.db,
        )
        return nightly.run(deps, kwargs.pop("today", TODAY), **kwargs)

    def rows(self, table):
        return self.db.tables.get(table, [])

    def asset(self, ticker):
        return next(a for a in self.rows("assets") if a["ticker"] == ticker)

    def prices(self, ticker):
        asset_id = self.asset(ticker)["id"]
        return sorted(
            (r for r in self.rows("prices") if r["asset_id"] == asset_id), key=lambda r: r["date"]
        )


@pytest.fixture
def fake(monkeypatch):
    monkeypatch.setattr(nightly.time, "sleep", lambda seconds: None)
    return Fake()


def test_all_good_is_success_and_closes_job_run(fake):
    result = fake.run()
    assert result.status == "success"
    job = fake.rows("job_runs")[-1]
    assert job["status"] == "success" and job["finished_at"]
    assert job["details"] == {"failed": [], "rejected": [], "skipped": []}


def test_one_asset_failure_does_not_stop_others(fake):
    fake.catalog = [stock("A")] + [stock(f"S{i}") for i in range(20)]
    fake.histories["A.SA"] = RuntimeError("yahoo down")
    result = fake.run()
    assert result.failed == ["A"]
    assert result.status == "partial"
    assert len(fake.prices("S1")) == 3
    assert fake.rows("job_runs")[-1]["details"]["failed"] == ["A"]


def test_ten_percent_failures_marks_failed_and_main_returns_1(fake, monkeypatch):
    fake.catalog = [stock("A")] + [stock(f"S{i}") for i in range(9)]
    fake.histories["A.SA"] = RuntimeError("yahoo down")
    deps = nightly.Deps(fake.fetch_history, fake.fetch_series, fake.fetch_tesouro, fake.catalog, fake.db)
    monkeypatch.setattr(nightly, "default_deps", lambda: deps)
    assert nightly.main([]) == 1
    assert fake.rows("job_runs")[-1]["status"] == "failed"


def test_main_returns_0_when_partial(fake, monkeypatch):
    fake.catalog = [stock("A")] + [stock(f"S{i}") for i in range(20)]
    fake.histories["A.SA"] = RuntimeError("yahoo down")
    deps = nightly.Deps(fake.fetch_history, fake.fetch_series, fake.fetch_tesouro, fake.catalog, fake.db)
    monkeypatch.setattr(nightly, "default_deps", lambda: deps)
    assert nightly.main([]) == 0


def test_macro_failure_marks_failed_but_assets_are_written(fake):
    fake.macro_error = RuntimeError("bcb down")
    result = fake.run()
    assert result.status == "failed"
    assert len(fake.prices("A")) == 3
    assert any("macro" in item for item in result.failed)


def test_tesouro_failure_marks_failed_but_stocks_are_written(fake):
    fake.tesouro_error = RuntimeError("tesouro down")
    result = fake.run()
    assert result.status == "failed"
    assert len(fake.prices("A")) == 3
    assert "tesouro" in result.failed


def test_tesouro_failure_keeps_existing_titles_active(fake):
    title = Asset("TD-SELIC-20290301", "Tesouro Selic 2029", "tesouro", "BRL", "Renda fixa", False,
                  maturity=date(2029, 3, 1))
    fake.tesouro = TesouroData([title], {title.ticker: days_back(3)}, [])
    fake.run()
    fake.tesouro_error = RuntimeError("tesouro down")
    fake.run()
    assert fake.asset("TD-SELIC-20290301")["active"] is True


def test_tesouro_prices_and_skipped_lines_are_recorded(fake):
    title = Asset("TD-SELIC-20290301", "Tesouro Selic 2029", "tesouro", "BRL", "Renda fixa", False,
                  maturity=date(2029, 3, 1))
    fake.tesouro = TesouroData([title], {title.ticker: days_back(3)}, ["tipo desconhecido: X"])
    result = fake.run()
    assert len(fake.prices("TD-SELIC-20290301")) == 3
    assert fake.asset("TD-SELIC-20290301")["maturity"] == "2029-03-01"
    assert result.skipped == ["tipo desconhecido: X"]
    assert result.status == "success"


def test_empty_history_keeps_existing_rows(fake):
    fake.histories["A.SA"] = History(days_back(5), [])
    fake.run()
    fake.histories["A.SA"] = History([], [])
    result = fake.run()
    assert len(fake.prices("A")) == 5
    assert result.failed == []
    assert any("A" in item for item in result.skipped)


def test_second_run_same_day_is_idempotent(fake):
    fake.run()
    first = {t: [dict(r) for r in rows] for t, rows in fake.db.tables.items() if t != "job_runs"}
    fake.run()
    second = {t: rows for t, rows in fake.db.tables.items() if t != "job_runs"}
    assert first == second


def test_incremental_start_is_last_saved_minus_5_days(fake):
    fake.histories["A.SA"] = History(days_back(10), [])
    fake.run()
    fake.history_calls.clear()
    fake.run()
    last_saved = TODAY - timedelta(days=1)
    assert ("A.SA", last_saved - timedelta(days=5)) in fake.history_calls


def test_new_asset_uses_start_none(fake):
    fake.run()
    assert ("A.SA", None) in fake.history_calls


def test_full_option_uses_start_none_for_known_asset(fake):
    fake.run()
    fake.history_calls.clear()
    fake.run(full=True)
    assert ("A.SA", None) in fake.history_calls


def test_previous_close_is_the_last_close_before_the_start(fake):
    fake.histories["A.SA"] = History(days_back(10), [])
    fake.run()
    jump = days_back(3, close=100.0)
    jump[-1] = row(TODAY, 200.0)
    fake.histories["A.SA"] = History(jump, [])
    result = fake.run()
    assert [item["date"] for item in result.rejected] == [TODAY.isoformat()]


def test_new_split_triggers_full_refetch_without_previous_close(fake):
    fake.histories["A.SA"] = History(days_back(10, close=100.0), [])
    fake.run()

    def after_split(start):
        if start is None:
            return History(days_back(10, close=50.0), [(TODAY - timedelta(days=1), 2.0)])
        return History(days_back(3, close=50.0), [(TODAY - timedelta(days=1), 2.0)])

    fake.histories["A.SA"] = after_split
    fake.history_calls.clear()
    result = fake.run()
    assert [call for call in fake.history_calls if call[0] == "A.SA"][-1] == ("A.SA", None)
    assert result.rejected == []
    assert {r["close"] for r in fake.prices("A")} == {50.0}
    assert len(fake.rows("splits")) == 1


def test_known_split_does_not_refetch(fake):
    fake.histories["A.SA"] = History(days_back(10), [(TODAY - timedelta(days=1), 2.0)])
    fake.run()
    fake.history_calls.clear()
    fake.histories["A.SA"] = History(days_back(3), [(TODAY - timedelta(days=1), 2.0)])
    fake.run()
    assert [call[1] for call in fake.history_calls if call[0] == "A.SA"] != [None]
    assert len([call for call in fake.history_calls if call[0] == "A.SA"]) == 1


def test_changed_adjusted_close_triggers_full_refetch(fake):
    fake.histories["A.SA"] = History(days_back(10, close=100.0), [])
    fake.run()

    def after_dividend(start):
        rows = days_back(10 if start is None else 3, close=100.0)
        return History([row(r["date"], r["close"], 99.0) for r in rows], [])

    fake.histories["A.SA"] = after_dividend
    fake.history_calls.clear()
    fake.run()
    calls = [call for call in fake.history_calls if call[0] == "A.SA"]
    assert len(calls) == 2 and calls[-1] == ("A.SA", None)
    assert {r["adj_close"] for r in fake.prices("A")} == {99.0}


def test_rejected_price_is_not_saved_and_is_reported(fake):
    fake.histories["A.SA"] = History([row(TODAY - timedelta(days=1), 10.0), row(TODAY, 100.0)], [])
    result = fake.run()
    assert [r["date"] for r in fake.prices("A")] == [(TODAY - timedelta(days=1)).isoformat()]
    assert result.rejected[0]["ticker"] == "A"
    assert result.rejected[0]["date"] == TODAY.isoformat()
    assert result.status == "partial"


def test_release_flag_allows_rejected_date(fake):
    fake.histories["A.SA"] = History([row(TODAY - timedelta(days=1), 10.0), row(TODAY, 100.0)], [])
    result = fake.run(released={("A", TODAY)})
    assert len(fake.prices("A")) == 2
    assert result.rejected == []


def test_release_of_other_ticker_does_not_apply(fake):
    fake.histories["A.SA"] = History([row(TODAY - timedelta(days=1), 10.0), row(TODAY, 100.0)], [])
    assert fake.run(released={("B", TODAY)}).rejected


def test_asset_removed_from_catalog_becomes_inactive(fake):
    fake.run()
    fake.catalog = [stock("B")]
    fake.history_calls.clear()
    fake.run()
    assert fake.asset("A")["active"] is False
    assert fake.asset("B")["active"] is True
    assert not [call for call in fake.history_calls if call[0] == "A.SA"]


def test_tickers_option_processes_only_those(fake):
    fake.run(tickers=["A"])
    assert [call[0] for call in fake.history_calls] == ["A.SA"]
    assert fake.tesouro_calls == 0
    assert fake.prices("A")
    assert fake.prices("B") == []
    assert fake.asset("B")["active"] is True


def test_tickers_option_does_not_deactivate_assets(fake):
    fake.run()
    fake.catalog = [stock("B")]
    fake.run(tickers=["B"])
    assert fake.asset("A")["active"] is True


def test_unknown_ticker_is_reported(fake):
    result = fake.run(tickers=["A", "NOPE"])
    assert any("NOPE" in item for item in result.skipped)


def test_job_run_is_closed_on_unexpected_error(fake):
    fake.db.fail_on = "assets"
    result = fake.run()
    assert result.status == "failed"
    job = fake.rows("job_runs")[-1]
    assert job["status"] == "failed" and job["finished_at"]
    assert "assets is down" in job["details"]["error"]


def test_macro_start_is_last_saved_minus_5_days_or_ten_years(fake):
    fake.run()
    assert fake.macro_calls[0][1] == date(2016, 11, 3)
    fake.macro_calls.clear()
    fake.run()
    assert fake.macro_calls[0][1] == TODAY - timedelta(days=5)
    assert fake.macro_calls[0][2] == TODAY


def test_macro_values_are_saved_for_every_series(fake):
    fake.run()
    assert {r["series"] for r in fake.rows("macro_series")} == {"selic", "cdi", "ipca"}


def monthly_history(months, step=0.01):
    """Month-end closes that end before TODAY's month."""
    rows, close = [], 100.0
    year, month = 2026, 10
    days = []
    for _ in range(months):
        days.append(date(year, month, 28))
        year, month = (year - 1, 12) if month == 1 else (year, month - 1)
    for i, day in enumerate(reversed(days)):
        close *= 1 + (step if i % 2 else -step / 2)
        rows.append(row(day, close))
    return rows


def test_monthly_returns_and_stats_are_saved(fake):
    fake.histories["A.SA"] = History(monthly_history(14), [])
    fake.run()
    asset_id = fake.asset("A")["id"]
    monthly = [r for r in fake.rows("monthly_returns") if r["asset_id"] == asset_id]
    assert len(monthly) == 13
    assert all(r["ret_brl"] == r["ret_local"] for r in monthly)
    stats = next(r for r in fake.rows("asset_stats") if r["asset_id"] == asset_id)
    assert stats["as_of"] == TODAY.isoformat()
    assert stats["volatility"] is not None


def test_asset_without_prices_has_no_stats(fake):
    fake.histories["A.SA"] = History([], [])
    fake.run()
    ids = {r["asset_id"] for r in fake.rows("asset_stats")}
    assert fake.asset("A")["id"] not in ids


def test_sector_stats_exclude_tesouro_and_index(fake):
    title = Asset("TD-SELIC-20290301", "Tesouro Selic 2029", "tesouro", "BRL", "Renda fixa", False,
                  maturity=date(2029, 3, 1))
    index = Asset("^BVSP", "Ibovespa", "indice", "BRL", "Índice falso", False, holdable=False)
    fake.catalog = [stock("A", "Bancos"), index]
    fake.tesouro = TesouroData([title], {title.ticker: monthly_history(14)}, [])
    fake.histories["A.SA"] = History(monthly_history(14), [])
    fake.histories["^BVSP"] = History(monthly_history(14), [])
    fake.run()
    assert {r["sector"] for r in fake.rows("sector_stats")} == {"Bancos"}


def test_sector_stats_keep_assets_outside_the_tickers_option(fake):
    fake.catalog = [stock("A"), stock("B")]
    fake.histories["A.SA"] = History(monthly_history(14, step=0.02), [])
    fake.histories["B.SA"] = History(monthly_history(14, step=0.20), [])
    fake.run()
    before = next(r for r in fake.rows("sector_stats") if r["sector"] == "Bancos")["worst_month_ret"]
    fake.run(tickers=["A"])
    after = next(r for r in fake.rows("sector_stats") if r["sector"] == "Bancos")["worst_month_ret"]
    assert after == pytest.approx(before)


def test_parse_release_handles_caret_tickers():
    assert nightly.parse_release("^BVSP:2026-10-30") == ("^BVSP", date(2026, 10, 30))


def test_false_adjustment_step_is_repaired_before_saving(fake):
    fake.histories["A.SA"] = History(
        [row(TODAY - timedelta(days=2), 100.0, 10.0), row(TODAY - timedelta(days=1), 100.0, 100.0)], []
    )
    fake.run()
    assert [r["adj_close"] for r in fake.prices("A")] == pytest.approx([100.0, 100.0])


def test_main_merges_released_file_with_release_option(fake, monkeypatch):
    seen = {}

    def fake_run(deps, today, tickers=None, full=False, released=frozenset(), history_starts=None):
        seen["released"] = released
        return nightly.RunResult("success")

    monkeypatch.setattr(nightly, "run", fake_run)
    monkeypatch.setattr(nightly, "default_deps", lambda: None)
    monkeypatch.setattr(nightly, "load_released", lambda: {("A", date(2026, 1, 2))})
    assert nightly.main(["--release", "B:2026-01-03"]) == 0
    assert seen["released"] == {("A", date(2026, 1, 2)), ("B", date(2026, 1, 3))}


def test_refetch_with_moved_window_removes_rows_it_did_not_rewrite(fake):
    fake.histories["A.SA"] = History(days_back(10, close=100.0), [])
    fake.run()
    split_day = TODAY - timedelta(days=1)

    def after_split(start):
        return History(days_back(7, close=50.0), [(split_day, 2.0)])

    fake.histories["A.SA"] = after_split
    result = fake.run()
    assert result.rejected == []
    assert len(fake.prices("A")) == 7
    assert {r["close"] for r in fake.prices("A")} == {50.0}


def test_refetch_removes_saved_row_on_a_rejected_date(fake):
    days = days_back(6, close=100.0)
    fake.histories["A.SA"] = History(days, [])
    fake.run()
    bad_day = days[3]["date"]
    new_rows = [row(r["date"], 500.0 if r["date"] == bad_day else 50.0) for r in days]
    fake.histories["A.SA"] = History(new_rows, [(days[-1]["date"], 2.0)])
    result = fake.run()
    assert [item["date"] for item in result.rejected] == [bad_day.isoformat()]
    assert bad_day.isoformat() not in [r["date"] for r in fake.prices("A")]
    assert {r["close"] for r in fake.prices("A")} == {50.0}


def test_truncated_refetch_keeps_saved_rows(fake):
    days = days_back(10, close=100.0)
    fake.histories["A.SA"] = History(days, [])
    fake.run()
    fake.histories["A.SA"] = lambda start: History(days[:4], [(days[0]["date"], 2.0)])
    fake.run()
    assert len(fake.prices("A")) == 10


def test_refetch_removes_monthly_returns_of_removed_months(fake):
    history = monthly_history(14)
    fake.histories["A.SA"] = History(history, [])
    fake.run()
    asset_id = fake.asset("A")["id"]
    months = lambda: sorted(r["month"] for r in fake.rows("monthly_returns") if r["asset_id"] == asset_id)
    first_month = months()[0]
    scaled = [row(r["date"], r["close"] / 2) for r in history[2:]]
    fake.histories["A.SA"] = History(scaled, [(history[-1]["date"], 2.0)])
    fake.run()
    assert first_month not in months()
    assert len(months()) == 11
    values = [r["ret_local"] for r in fake.rows("monthly_returns") if r["asset_id"] == asset_id]
    assert all(abs(value) < 0.1 for value in values)


def test_all_assets_without_data_marks_failed(fake):
    fake.catalog = [stock(f"S{i}") for i in range(20)]
    for i in range(20):
        fake.histories[f"S{i}.SA"] = History([], [])
    assert fake.run().status == "failed"


def test_one_asset_without_data_among_many_is_success(fake):
    fake.catalog = [stock(f"S{i}") for i in range(20)]
    fake.histories["S0.SA"] = History([], [])
    assert fake.run().status == "success"


def test_history_start_drops_earlier_prices_and_splits(fake):
    cut = TODAY - timedelta(days=3)
    fake.histories["A.SA"] = History(days_back(10), [(TODAY - timedelta(days=8), 2.0)])
    fake.run(history_starts={"A": cut})
    assert fake.prices("A")[0]["date"] == cut.isoformat()
    assert fake.rows("splits") == []


def test_history_start_removes_saved_rows_on_full_run(fake):
    fake.histories["A.SA"] = History(days_back(10), [])
    fake.run()
    cut = TODAY - timedelta(days=3)
    fake.run(full=True, history_starts={"A": cut})
    assert fake.prices("A")[0]["date"] == cut.isoformat()


def test_split_before_history_start_does_not_trigger_refetch(fake):
    cut = TODAY - timedelta(days=3)
    fake.histories["A.SA"] = History(days_back(10), [(TODAY - timedelta(days=8), 2.0)])
    fake.run(history_starts={"A": cut})
    fake.history_calls.clear()
    fake.run(history_starts={"A": cut})
    assert len([call for call in fake.history_calls if call[0] == "A.SA"]) == 1


def test_change_only_on_the_latest_saved_day_does_not_refetch(fake):
    days = days_back(10, close=100.0)
    fake.histories["A.SA"] = History(days, [])
    fake.run()
    moved = days[:-1] + [row(days[-1]["date"], 101.0)]
    fake.histories["A.SA"] = History(moved, [])
    fake.history_calls.clear()
    fake.run()
    assert len([call for call in fake.history_calls if call[0] == "A.SA"]) == 1
    assert fake.prices("A")[-1]["close"] == 101.0


def title(ticker):
    return Asset(ticker, ticker, "tesouro", "BRL", "Renda fixa", False, maturity=date(2035, 5, 15))


def test_coupon_title_has_no_return_because_coupons_are_not_counted(fake):
    coupon = title("TD-IPCAJ-20350515")
    plain = title("TD-IPCA-20350515")
    fake.tesouro = TesouroData(
        [coupon, plain],
        {coupon.ticker: monthly_history(14), plain.ticker: monthly_history(14)},
        [],
    )
    fake.run()
    stats = {r["asset_id"]: r for r in fake.rows("asset_stats")}
    coupon_stats = stats[fake.asset(coupon.ticker)["id"]]
    assert coupon_stats["return_annual"] is None
    assert coupon_stats["sharpe"] is None
    assert coupon_stats["volatility"] is not None
    assert stats[fake.asset(plain.ticker)["id"]]["return_annual"] is not None


def test_run_limited_by_tickers_is_marked_in_details(fake):
    fake.run(tickers=["A"])
    assert fake.rows("job_runs")[-1]["details"]["tickers"] == ["A"]
