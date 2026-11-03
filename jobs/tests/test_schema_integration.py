import pytest


@pytest.mark.integration
def test_publishable_key_reads_but_cannot_write(rest):
    assert rest.get("/assets?select=id&limit=1", key="publishable").status_code == 200
    row = {"ticker": "HACK", "name": "x", "class": "indice", "currency": "BRL",
           "holdable": False, "ml_enabled": False, "active": False}
    assert rest.post("/assets", json=row, key="publishable").status_code in (401, 403)


@pytest.mark.integration
def test_secret_key_can_write_and_delete(rest):
    row = {"ticker": "TESTE-ESQUEMA", "name": "x", "class": "indice", "currency": "BRL",
           "holdable": False, "ml_enabled": False, "active": False}
    assert rest.post("/assets", json=row, key="secret").status_code == 201
    assert rest.delete("/assets?ticker=eq.TESTE-ESQUEMA", key="secret").status_code == 204


@pytest.mark.integration
def test_invalid_class_is_rejected(rest):
    row = {"ticker": "TESTE-CLASSE", "name": "x", "class": "etf", "currency": "BRL",
           "holdable": False, "ml_enabled": False, "active": False}
    assert rest.post("/assets", json=row, key="secret").status_code == 400
