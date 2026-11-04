from datetime import date

import pytest

from pipeline import db as real_db
from pipeline import demo_seed
from pipeline.demo_seed import (
    PERSONAS_PATH,
    TRANSACTIONS_PATH,
    check_positions,
    load_personas,
    load_transactions,
    price_paid,
    seed,
)

TODAY = date(2026, 11, 3)


def buy(ticker, quantity, day):
    return {"persona": "ana", "ticker": ticker, "type": "buy", "quantity": quantity, "date": day}


def sell(ticker, quantity, day):
    return {"persona": "ana", "ticker": ticker, "type": "sell", "quantity": quantity, "date": day}


class FakeDb:
    def __init__(self):
        self.tables = {
            "assets": [
                {"id": 1, "ticker": "A", "active": True, "holdable": True},
                {"id": 2, "ticker": "OLD", "active": False, "holdable": True},
                {"id": 3, "ticker": "^BVSP", "active": True, "holdable": False},
            ],
            "prices": [
                {"asset_id": 1, "date": "2026-03-10", "close": 50.0},
                {"asset_id": 2, "date": "2026-03-10", "close": 50.0},
                {"asset_id": 3, "date": "2026-03-10", "close": 50.0},
            ],
            "splits": [],
            "demo_personas": [],
            "demo_transactions": [],
        }

    def select_all(self, table, params):
        rows = list(self.tables[table])
        for column, value in params.items():
            if column not in ("select", "order"):
                rows = [r for r in rows if str(r[column]) == value.removeprefix("eq.")]
        return [dict(r) for r in rows]

    def upsert(self, table, rows, on_conflict, batch_size=1000):
        columns = on_conflict.split(",")
        for raw in rows:
            clean = real_db._clean(raw)
            stored = self.tables[table]
            found = next(
                (r for r in stored if all(r[c] == clean[c] for c in columns)),
                None,
            )
            if found:
                found.update(clean)
            else:
                stored.append({"id": len(stored) + 1, **clean})
        return len(rows)


@pytest.fixture
def fake_db(monkeypatch):
    monkeypatch.setattr(
        demo_seed,
        "load_personas",
        lambda path=PERSONAS_PATH: [
            {"slug": "ana", "name": "Ana", "risk_profile": "moderado", "description": "x"}
        ],
    )
    return FakeDb()


def use_rows(monkeypatch, *rows):
    monkeypatch.setattr(demo_seed, "load_transactions", lambda path=TRANSACTIONS_PATH: list(rows))


def test_price_paid_undoes_later_splits():
    assert price_paid(50.0, [2.0]) == 100.0
    assert price_paid(33.9, [0.1, 1.05]) == pytest.approx(3.56, abs=0.01)
    assert price_paid(50.0, []) == 50.0


def test_cost_of_a_split_asset_matches_the_real_price():
    # Bought 10 at 100 before a 2:1 split. The source shows a close of 50 on that date.
    price = price_paid(50.0, [2.0])
    assert 10 * price == 1000.0


def test_selling_more_than_held_raises():
    rows = [buy("A", 10, date(2024, 1, 1)), sell("A", 11, date(2024, 2, 1))]
    with pytest.raises(ValueError, match="A"):
        check_positions(rows, {})


def test_split_counts_when_checking_a_later_sale():
    rows = [buy("A", 10, date(2024, 1, 1)), sell("A", 15, date(2024, 3, 1))]
    check_positions(rows, {"A": [(date(2024, 2, 1), 2.0)]})


def test_sale_before_the_purchase_raises():
    rows = [sell("A", 1, date(2024, 1, 1)), buy("A", 10, date(2024, 2, 1))]
    with pytest.raises(ValueError, match="A"):
        check_positions(rows, {})


def test_price_uses_last_close_on_or_before_the_date(fake_db, monkeypatch):
    use_rows(monkeypatch, buy("A", 10, date(2026, 3, 12)))
    assert seed(fake_db, TODAY) == 1
    saved = fake_db.tables["demo_transactions"][0]
    assert saved["price"] == 50.0
    assert saved["date"] == "2026-03-12"


def test_split_after_the_purchase_raises_the_saved_price(fake_db, monkeypatch):
    fake_db.tables["splits"] = [{"asset_id": 1, "date": "2026-04-01", "ratio": 2.0}]
    use_rows(monkeypatch, buy("A", 10, date(2026, 3, 12)))
    seed(fake_db, TODAY)
    assert fake_db.tables["demo_transactions"][0]["price"] == 100.0


def test_split_on_the_purchase_date_is_ignored(fake_db, monkeypatch):
    fake_db.tables["splits"] = [{"asset_id": 1, "date": "2026-03-12", "ratio": 2.0}]
    use_rows(monkeypatch, buy("A", 10, date(2026, 3, 12)))
    seed(fake_db, TODAY)
    assert fake_db.tables["demo_transactions"][0]["price"] == 50.0


def test_more_than_5_days_without_price_raises(fake_db, monkeypatch):
    use_rows(monkeypatch, buy("A", 10, date(2026, 3, 16)))
    with pytest.raises(ValueError, match="A"):
        seed(fake_db, TODAY)


def test_exactly_5_days_without_price_is_accepted(fake_db, monkeypatch):
    use_rows(monkeypatch, buy("A", 10, date(2026, 3, 15)))
    assert seed(fake_db, TODAY) == 1


def test_unknown_ticker_raises(fake_db, monkeypatch):
    use_rows(monkeypatch, buy("NOPE", 10, date(2026, 3, 12)))
    with pytest.raises(ValueError, match="NOPE"):
        seed(fake_db, TODAY)


@pytest.mark.parametrize("ticker", ["OLD", "^BVSP"])
def test_inactive_or_not_holdable_ticker_raises(fake_db, monkeypatch, ticker):
    use_rows(monkeypatch, buy(ticker, 10, date(2026, 3, 12)))
    with pytest.raises(ValueError, match="BVSP|OLD"):
        seed(fake_db, TODAY)


def test_future_date_raises(fake_db, monkeypatch):
    use_rows(monkeypatch, buy("A", 10, date(2026, 11, 4)))
    with pytest.raises(ValueError, match="A"):
        seed(fake_db, TODAY)


def test_unknown_persona_raises(fake_db, monkeypatch):
    row = buy("A", 10, date(2026, 3, 12))
    row["persona"] = "nobody"
    use_rows(monkeypatch, row)
    with pytest.raises(ValueError, match="nobody"):
        seed(fake_db, TODAY)


def test_seed_twice_keeps_the_same_rows(fake_db, monkeypatch):
    use_rows(monkeypatch, buy("A", 10, date(2026, 3, 12)))
    seed(fake_db, TODAY)
    first = [dict(r) for r in fake_db.tables["demo_transactions"]]
    seed(fake_db, TODAY)
    assert fake_db.tables["demo_transactions"] == first
    assert len(fake_db.tables["demo_personas"]) == 1


def test_real_files_pass_the_checks():
    personas = {persona["slug"] for persona in load_personas()}
    rows = load_transactions()
    assert personas == {"bruno", "ana", "carla"}
    assert len(rows) == 23
    assert {row["persona"] for row in rows} == personas
    assert {row["type"] for row in rows} == {"buy", "sell"}
    for persona in personas:
        check_positions([row for row in rows if row["persona"] == persona], {})


def test_real_description_with_comma_is_read_whole():
    ana = next(persona for persona in load_personas() if persona["slug"] == "ana")
    assert ana["description"] == "Busca equilíbrio entre Tesouro, ações e fundos imobiliários."
