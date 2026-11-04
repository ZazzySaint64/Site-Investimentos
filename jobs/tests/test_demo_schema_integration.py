import pytest


@pytest.mark.integration
def test_publishable_key_reads_personas_but_cannot_write(rest):
    assert rest.get("/demo_personas?select=id&limit=1", key="publishable").status_code == 200
    row = {"slug": "x", "name": "x", "risk_profile": "moderado", "description": "x"}
    assert rest.post("/demo_personas", json=row, key="publishable").status_code in (401, 403)


@pytest.mark.integration
def test_invalid_profile_is_rejected(rest):
    row = {"slug": "x", "name": "x", "risk_profile": "ousado", "description": "x"}
    assert rest.post("/demo_personas", json=row, key="secret").status_code == 400


@pytest.mark.integration
def test_publishable_key_reads_transactions(rest):
    assert rest.get("/demo_transactions?select=id&limit=1", key="publishable").status_code == 200
