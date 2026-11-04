import base64
import json
import secrets
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta

import pytest
import requests

from pipeline import auth_admin

pytestmark = pytest.mark.integration

QUANTITY_MESSAGE = "Informe uma quantidade maior que zero e menor que 100 bilhões."
PRICE_MESSAGE = "Informe um preço maior que zero e menor que 100 bilhões."
VALUE_MESSAGE = "Informe um valor maior que zero e menor que 100 bilhões."
CDI_PCT_MESSAGE = "Informe um percentual do CDI entre 0 e 1000."
NAME_MESSAGE = "Informe um nome de até 80 caracteres."
DENIED = (401, 403)


def call(rest, token, fn, **args):
    return rest.post(f"/rpc/{fn}", json=args, key="publishable", token=token)


def add(rest, token, ticker, type_, quantity, price, day):
    return call(
        rest,
        token,
        "add_transaction",
        p_ticker=ticker,
        p_type=type_,
        p_quantity=quantity,
        p_price=price,
        p_date=day,
    )


def add_fixed(rest, token, **overrides):
    args = {
        "p_name": "CDB Teste",
        "p_principal": 1000,
        "p_cdi_pct": 100,
        "p_start_date": "2024-01-01",
        "p_maturity": None,
        "p_daily_liquidity": True,
    }
    return call(rest, token, "add_fixed_income", **{**args, **overrides})


def user_id_of(token):
    payload = token.split(".")[1]
    return json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))["sub"]


def transaction_count(rest, token):
    return len(rest.get("/transactions?select=id", key="publishable", token=token).json())


@pytest.fixture(autouse=True)
def clean_user_rows(rest, users):
    yield
    for user_id in users.ids.values():
        for table in ("transactions", "fixed_income", "profiles"):
            response = rest.delete(f"/{table}?user_id=eq.{user_id}", key="secret")
            response.raise_for_status()


def days_from_today(days):
    return (date.today() + timedelta(days=days)).isoformat()


def test_each_user_sees_only_their_own_rows(rest, users):
    assert add(rest, users["a"], "ZZTESTE3", "buy", 10, 5, "2024-01-01").status_code == 200
    assert transaction_count(rest, users["a"]) == 1
    assert rest.get("/transactions?select=id", key="publishable", token=users["b"]).json() == []


def test_other_user_cannot_delete_a_transaction(rest, users):
    row_id = add(rest, users["a"], "ZZTESTE3", "buy", 10, 5, "2024-01-01").json()
    response = call(rest, users["b"], "delete_transaction", p_id=row_id)
    assert response.status_code == 400
    assert response.json()["message"] == "Lançamento não encontrado."


def test_tables_refuse_direct_writes(rest, users):
    token = users["a"]
    user_id = user_id_of(token)
    row_id = add(rest, token, "ZZTESTE3", "buy", 10, 5, "2024-01-01").json()
    asset_id = rest.get("/assets?select=id&ticker=eq.ZZTESTE3", key="secret").json()[0]["id"]
    payloads = {
        "transactions": (
            {
                "user_id": user_id,
                "asset_id": asset_id,
                "type": "buy",
                "quantity": 1,
                "price": 1,
                "date": "2024-01-01",
            },
            {"price": 1},
        ),
        "fixed_income": (
            {
                "user_id": user_id,
                "name": "x",
                "principal": 1,
                "cdi_pct": 1,
                "start_date": "2024-01-01",
                "daily_liquidity": True,
            },
            {"name": "x"},
        ),
    }
    for table, (row, patch_body) in payloads.items():
        post = rest.post(f"/{table}", json=row, key="publishable", token=token)
        patch = rest.patch(
            f"/{table}?id=eq.{row_id}", json=patch_body, key="publishable", token=token
        )
        delete = rest.delete(f"/{table}?id=eq.{row_id}", key="publishable", token=token)
        assert post.status_code in DENIED, table
        assert patch.status_code in DENIED, table
        assert delete.status_code in DENIED, table
    assert transaction_count(rest, token) == 1


def test_anonymous_gets_nothing(rest):
    for table in ("profiles", "transactions", "fixed_income"):
        assert rest.get(f"/{table}?select=*", key="publishable").status_code in DENIED
    assert add(rest, None, "ZZTESTE3", "buy", 10, 5, "2024-01-01").status_code in DENIED


def test_profile_cannot_be_written_for_another_user(rest, users):
    profile = {
        "user_id": user_id_of(users["a"]),
        "risk_profile": "moderado",
        "target_allocation": {},
    }
    forged = rest.post("/profiles", json=profile, key="publishable", token=users["b"])
    assert forged.status_code in DENIED
    own = {**profile, "user_id": user_id_of(users["b"])}
    assert rest.post("/profiles", json=own, key="publishable", token=users["b"]).status_code == 201


def test_profile_of_another_user_is_invisible_and_untouchable(rest, users):
    a_id = user_id_of(users["a"])
    profile = {"user_id": a_id, "risk_profile": "moderado", "target_allocation": {}}
    assert rest.post("/profiles", json=profile, key="publishable", token=users["a"]).status_code == 201

    seen = rest.get("/profiles?select=user_id", key="publishable", token=users["b"]).json()
    assert [row for row in seen if row["user_id"] == a_id] == []

    rest.patch(
        f"/profiles?user_id=eq.{a_id}",
        json={"risk_profile": "arrojado"},
        key="publishable",
        token=users["b"],
    )
    stored = rest.get(f"/profiles?user_id=eq.{a_id}&select=risk_profile", key="secret").json()
    assert stored == [{"risk_profile": "moderado"}]


@pytest.mark.parametrize("quantity", [0, -1, None, "NaN", 1e13, 0.0000001])
def test_invalid_quantity_gets_the_rule_message(rest, users, quantity):
    response = add(rest, users["a"], "ZZTESTE3", "buy", quantity, 5, "2024-01-01")
    assert response.status_code == 400
    assert response.json()["message"] == QUANTITY_MESSAGE


@pytest.mark.parametrize("price", [0, -1, None, "NaN", 1e13, 0.0000001])
def test_invalid_price_gets_the_rule_message(rest, users, price):
    response = add(rest, users["a"], "ZZTESTE3", "buy", 1, price, "2024-01-01")
    assert response.status_code == 400
    assert response.json()["message"] == PRICE_MESSAGE


def test_future_date_empty_date_unknown_ticker_and_index_are_rejected(rest, users):
    future = "Informe uma data que não esteja no futuro."
    cases = [
        (("ZZTESTE3", "buy", 1, 5, days_from_today(2)), future),
        (("ZZTESTE3", "buy", 1, 5, None), future),
        (("NAOEXISTE", "buy", 1, 5, "2024-01-01"), "Ativo não encontrado."),
        (("^BVSP", "buy", 1, 5, "2024-01-01"), "Este ativo não pode entrar na carteira."),
        (("ZZTESTE3", "hold", 1, 5, "2024-01-01"), "Operação inválida."),
    ]
    for args, message in cases:
        response = add(rest, users["a"], *args)
        assert response.status_code == 400, args
        assert response.json()["message"] == message, args


def test_ticker_is_accepted_in_lowercase(rest, users):
    assert add(rest, users["a"], " zzteste3 ", "buy", 1, 5, "2024-01-01").status_code == 200


def test_selling_more_than_held_names_the_date(rest, users):
    add(rest, users["a"], "ZZTESTE3", "buy", 10, 5, "2024-01-01")
    response = add(rest, users["a"], "ZZTESTE3", "sell", 11, 5, "2024-02-01")
    assert "posição negativa em 01/02/2024" in response.json()["message"]


def test_sale_dated_before_the_buy_is_rejected(rest, users):
    add(rest, users["a"], "ZZTESTE3", "buy", 10, 5, "2024-02-01")
    response = add(rest, users["a"], "ZZTESTE3", "sell", 1, 5, "2024-01-01")
    assert response.status_code == 400
    assert "posição negativa em 01/01/2024" in response.json()["message"]
    assert transaction_count(rest, users["a"]) == 1


def test_buy_and_full_sale_on_the_same_day_is_accepted(rest, users):
    assert add(rest, users["a"], "ZZTESTE3", "buy", 10, 5, "2024-01-01").status_code == 200
    assert add(rest, users["a"], "ZZTESTE3", "sell", 10, 5, "2024-01-01").status_code == 200


def test_deleting_a_buy_that_a_later_sale_needs_is_rejected(rest, users):
    buy_id = add(rest, users["a"], "ZZTESTE3", "buy", 10, 5, "2024-01-01").json()
    add(rest, users["a"], "ZZTESTE3", "sell", 5, 5, "2024-02-01")
    response = call(rest, users["a"], "delete_transaction", p_id=buy_id)
    assert response.status_code == 400
    assert "posição negativa" in response.json()["message"]
    assert transaction_count(rest, users["a"]) == 2


def test_later_split_counts_for_the_sale(rest, users):
    add(rest, users["a"], "ZZTESTE3", "buy", 10, 5, "2024-01-01")
    assert add(rest, users["a"], "ZZTESTE3", "sell", 20, 5, "2024-07-01").status_code == 200
    assert add(rest, users["a"], "ZZTESTE3", "sell", 1, 5, "2024-07-02").status_code == 400


def test_split_on_the_sale_date_applies_only_to_earlier_buys(rest, users):
    # The sandbox split (ratio 2) is on 2024-06-01: the 10 bought on 01/01 become 20.
    add(rest, users["a"], "ZZTESTE3", "buy", 10, 5, "2024-01-01")
    assert add(rest, users["a"], "ZZTESTE3", "sell", 20, 5, "2024-06-01").status_code == 200
    assert add(rest, users["a"], "ZZTESTE3", "sell", 1, 5, "2024-06-01").status_code == 400


def test_two_simultaneous_sales_do_not_both_pass(rest, users):
    add(rest, users["a"], "ZZTESTE3", "buy", 10, 5, "2024-07-01")
    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = [
            pool.submit(add, rest, users["a"], "ZZTESTE3", "sell", 6, 5, "2024-07-02")
            for _ in range(2)
        ]
        codes = sorted(future.result().status_code for future in futures)
    assert codes == [200, 400]


def test_fixed_income_rules(rest, users):
    cases = [
        ({"p_principal": 0}, VALUE_MESSAGE),
        ({"p_principal": "NaN"}, VALUE_MESSAGE),
        ({"p_cdi_pct": 0}, CDI_PCT_MESSAGE),
        ({"p_cdi_pct": 1001}, CDI_PCT_MESSAGE),
        (
            {"p_start_date": days_from_today(2)},
            "Informe uma data de início que não esteja no futuro.",
        ),
        ({"p_start_date": "2010-01-01"}, "Só há CDI a partir de "),
        ({"p_maturity": "2023-12-31"}, "O vencimento precisa ser depois do início."),
        ({"p_name": ""}, NAME_MESSAGE),
        ({"p_name": "x" * 81}, NAME_MESSAGE),
    ]
    for overrides, message in cases:
        response = add_fixed(rest, users["a"], **overrides)
        assert response.status_code == 400, overrides
        assert response.json()["message"].startswith(message), overrides
    assert add_fixed(rest, users["a"]).status_code == 200


def test_other_user_cannot_read_or_delete_fixed_income(rest, users):
    row_id = add_fixed(rest, users["a"]).json()
    assert rest.get("/fixed_income?select=id", key="publishable", token=users["b"]).json() == []
    response = call(rest, users["b"], "delete_fixed_income", p_id=row_id)
    assert response.status_code == 400
    assert response.json()["message"] == "Lançamento não encontrado."
    assert call(rest, users["a"], "delete_fixed_income", p_id=row_id).status_code == 204


def test_delete_my_account_removes_everything(rest, sandbox_asset):
    email = f"rls-{uuid.uuid4()}@example.com"
    password = secrets.token_urlsafe(24)
    user_id = auth_admin.create_user(email, password)
    try:
        token = auth_admin.sign_in(email, password)
        assert add(rest, token, "ZZTESTE3", "buy", 10, 5, "2024-01-01").status_code == 200
        assert add_fixed(rest, token).status_code == 200
        profile = {"user_id": user_id, "risk_profile": "moderado", "target_allocation": {}}
        created = rest.post("/profiles", json=profile, key="publishable", token=token)
        assert created.status_code == 201

        assert call(rest, token, "delete_my_account").status_code == 204

        for table in ("profiles", "transactions", "fixed_income"):
            rows = rest.get(f"/{table}?select=user_id&user_id=eq.{user_id}", key="secret").json()
            assert rows == []
        with pytest.raises(requests.HTTPError):
            auth_admin.sign_in(email, password)
    finally:
        auth_admin.delete_user(user_id)
