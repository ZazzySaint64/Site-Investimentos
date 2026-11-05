import io
import zipfile
from datetime import date

import pandas as pd
import pytest

from pipeline.sources import cvm

OLD = "11.111.111/0001-11"
NEW = "22.222.222/0001-22"


def table(rows):
    return pd.DataFrame(rows, dtype=str)


def geral(*rows):
    return table(
        [
            {"CNPJ_Fundo_Classe": cnpj, "Data_Referencia": day, "Versao": "1", "Codigo_ISIN": isin}
            for cnpj, day, isin in rows
        ]
    )


ASSET_COLUMNS = ("Total_Investido", "Direitos_Bens_Imoveis", "FII", *cvm.PAPER, *cvm.DEVELOPMENT)


def assets(cnpj, day, version="1", **values):
    zeros = dict.fromkeys(ASSET_COLUMNS, "0")
    return {"CNPJ_Fundo_Classe": cnpj, "Data_Referencia": day, "Versao": version, **zeros, **values}


def extra(cnpj, day, version="1", **values):
    base = {
        "Valor_Patrimonial_Cotas": "100.5",
        "Total_Numero_Cotistas": "1200",
        "Percentual_Despesas_Taxa_Administracao": "0.0008",
        "Percentual_Amortizacao_Cotas_Mes": "0",
    }
    return {"CNPJ_Fundo_Classe": cnpj, "Data_Referencia": day, "Versao": version, **base, **values}


BRICK = {"Total_Investido": "1000", "Direitos_Bens_Imoveis": "800", "FII": "100", "CRI": "50"}


def test_monthly_splits_the_invested_total_into_groups():
    rows = cvm.parse_monthly(
        geral((OLD, "2026-09-01", "BRHGLGCTF004")),
        table([assets(OLD, "2026-09-01", Imoveis_Venda_Construcao="200", **BRICK)]),
        table([extra(OLD, "2026-09-01")]),
        ["HGLG11"],
    )
    assert rows == [
        {
            "ticker": "HGLG11",
            "month": date(2026, 9, 1),
            "book_value": 100.5,
            "holders": 1200,
            "admin_fee": 0.0008,
            "amortization": 0.0,
            "share_buildings": 0.6,
            "share_development": 0.2,
            "share_paper": 0.05,
            "share_funds": 0.1,
            "share_other": pytest.approx(0.05),
        }
    ]


def test_monthly_ignores_other_funds_and_non_fund_isins():
    rows = cvm.parse_monthly(
        geral((OLD, "2026-09-01", "BRHGLGACNOR1"), (NEW, "2026-09-01", "BRXXXXCTF000")),
        table([assets(OLD, "2026-09-01", **BRICK), assets(NEW, "2026-09-01", **BRICK)]),
        table([extra(OLD, "2026-09-01"), extra(NEW, "2026-09-01")]),
        ["HGLG11"],
    )
    assert rows == []


def test_monthly_uses_the_corrected_version():
    rows = cvm.parse_monthly(
        geral((OLD, "2026-09-01", "BRHGLGCTF004")),
        table([assets(OLD, "2026-09-01", **BRICK)]),
        table(
            [
                extra(OLD, "2026-09-01", Valor_Patrimonial_Cotas="90"),
                extra(OLD, "2026-09-01", version="2", Valor_Patrimonial_Cotas="95"),
            ]
        ),
        ["HGLG11"],
    )
    assert [row["book_value"] for row in rows] == [95.0]


def test_monthly_prefers_the_new_cnpj_and_keeps_thirteen_months():
    days = [f"{year}-{month:02d}-01" for year in (2025, 2026) for month in range(1, 13)][:21]
    rows = cvm.parse_monthly(
        geral(*[(OLD, day, "BRHGLGCTF004") for day in days], (NEW, days[-1], "BRHGLGCTF004")),
        table(
            [
                assets(cnpj, day, **BRICK)
                for cnpj, day in [(OLD, d) for d in days] + [(NEW, days[-1])]
            ]
        ),
        table(
            [extra(OLD, day) for day in days] + [extra(NEW, days[-1], Valor_Patrimonial_Cotas="77")]
        ),
        ["HGLG11"],
    )
    assert len(rows) == cvm.MONTHS_KEPT
    assert rows[-1]["month"] == date(2026, 9, 1) and rows[-1]["book_value"] == 77.0


def building(cnpj, day, name, area, vacancy, revenue, default="0", kind=cvm.RENTED):
    return {
        "CNPJ_Fundo_Classe": cnpj,
        "Data_Referencia": day,
        "Versao": "1",
        "Classe": kind,
        "Nome_Imovel": name,
        "Area": area,
        "Percentual_Vacancia": vacancy,
        "Percentual_Inadimplencia": default,
        "Percentual_Receitas_FII": revenue,
    }


def contracts(cnpj, day, **bands):
    columns = [band for parts in cvm.LEASE_BANDS.values() for band in parts]
    return {
        "CNPJ_Fundo_Classe": cnpj,
        "Data_Referencia": day,
        "Versao": "1",
        **{f"Percentual_Vencimento_Receita_FII_Faixa_{c}": bands.get(c, "0") for c in columns},
    }


def tenant(cnpj, day, sector, share):
    row = {"CNPJ_Fundo_Classe": cnpj, "Data_Referencia": day, "Versao": "1"}
    return {**row, "Setor_Atuacao": sector, "Percentual_Receitas_FII": share}


def quarterly(buildings, tenants=(), leases=(), funds=((OLD, "2026-06-30"),)):
    return cvm.parse_quarterly(
        geral(*[(cnpj, day, "BRHGLGCTF004") for cnpj, day in funds]),
        table(list(buildings) or [building(OLD, "1900-01-01", "x", "1", "0", "0")]),
        table(list(tenants) or [tenant(OLD, "1900-01-01", "x", "0")]),
        table(list(leases) or [contracts(OLD, "1900-01-01")]),
        ["HGLG11"],
    )


def test_vacancy_is_weighted_by_area_and_default_by_revenue():
    [row] = quarterly(
        [
            building(OLD, "2026-06-30", "A", "300", "0.1", "0.6", default="0.05"),
            building(OLD, "2026-06-30", "B", "100", "0.5", "0.2", default="0"),
            building(OLD, "2026-06-30", "C", "999", "1", "0", kind="Imóveis para venda acabados"),
        ]
    )
    assert row["buildings"] == 2
    assert row["vacancy"] == pytest.approx(0.2)
    assert row["default_rate"] == pytest.approx(0.0375)
    assert row["vacancy_doubtful"] is False


def test_vacancy_that_contradicts_revenue_is_not_shown():
    [row] = quarterly([building(OLD, "2026-06-30", "Mall", "100", "0.97", "0.3")])
    assert (row["vacancy"], row["vacancy_doubtful"]) == (None, True)


def test_lease_bands_all_zero_mean_not_reported():
    [row] = quarterly(
        [building(OLD, "2026-06-30", "A", "1", "0", "1")],
        leases=[contracts(OLD, "2026-06-30")],
    )
    assert row["lease_12m"] is None and row["lease_over_36m"] is None


def test_lease_bands_are_grouped_by_year():
    leases = [
        contracts(OLD, "2026-06-30", Ate_3Meses="0.1", **{"9a12Meses": "0.1"}, Acima_36Meses="0.8")
    ]
    [row] = quarterly([building(OLD, "2026-06-30", "A", "1", "0", "1")], leases=leases)
    assert row["lease_12m"] == pytest.approx(0.2)
    assert (row["lease_24m"], row["lease_36m"], row["lease_over_36m"]) == (0, 0, 0.8)


def test_tenant_sectors_are_summed_and_ranked():
    tenants = [
        tenant(OLD, "2026-06-30", "Varejo ", "0.1"),
        tenant(OLD, "2026-06-30", "Logística", "0.3"),
        tenant(OLD, "2026-06-30", "Varejo ", "0.05"),
        tenant(OLD, "2026-06-30", "Nada", "0"),
    ]
    [row] = quarterly([building(OLD, "2026-06-30", "A", "1", "0", "1")], tenants=tenants)
    assert row["tenant_sectors"] == [
        {"sector": "Logística", "share": 0.3},
        {"sector": "Varejo", "share": pytest.approx(0.15)},
    ]


def test_an_empty_newer_report_loses_to_an_older_one_with_buildings():
    [row] = quarterly(
        [building(OLD, "2026-06-30", "A", "1", "0", "1")],
        funds=[(OLD, "2026-06-30"), (NEW, "2026-09-30")],
    )
    assert (row["quarter"], row["buildings"]) == (date(2026, 6, 30), 1)


def test_paper_fund_has_no_buildings():
    [row] = quarterly([], funds=[(OLD, "2026-06-30")])
    assert (row["buildings"], row["vacancy"], row["default_rate"]) == (0, None, None)


def test_read_zip_decodes_latin1_by_table_name():
    content = io.BytesIO()
    with zipfile.ZipFile(content, "w") as archive:
        archive.writestr(
            "inf_trimestral_fii_imovel_2026.csv", "Classe;Area\nImóveis;1\n".encode("latin-1")
        )
    tables = cvm.read_zip(content.getvalue())
    assert tables["imovel"]["Classe"].tolist() == ["Imóveis"]
