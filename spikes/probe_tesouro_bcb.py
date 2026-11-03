# Throwaway: measures the Tesouro CSV and the SGS API before the real sources are written.
import csv
import io
import time
from datetime import date, timedelta

import requests

TESOURO = (
    "https://www.tesourotransparente.gov.br/ckan/dataset/df56aa42-484a-4a59-8184-7676580c81e3"
    "/resource/796d2059-14e9-44e3-80c9-2d9e30b405c1/download/PrecoTaxaTesouroDireto.csv"
)
SGS = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.{code}/dados"

start = time.time()
raw = requests.get(TESOURO, timeout=180).content
print(f"Tesouro: {len(raw) / 1e6:.1f} MB in {time.time() - start:.1f}s")

for encoding in ("utf-8", "latin-1"):
    try:
        text = raw.decode(encoding)
        print(f"Encoding that decodes: {encoding}")
        break
    except UnicodeDecodeError as exc:
        print(f"{encoding} failed: {exc}")

rows = list(csv.DictReader(io.StringIO(text), delimiter=";"))
parse = lambda s: date(int(s[6:]), int(s[3:5]), int(s[:2]))
latest = max(parse(r["Data Base"]) for r in rows)
print(f"Rows: {len(rows)}; latest Data Base: {latest}")
print(f"Oldest Data Base: {min(parse(r['Data Base']) for r in rows)}")
print(f"Blank PU Base Manha: {sum(not r['PU Base Manha'].strip() for r in rows)}")
print("Tipo Titulo:", sorted({r["Tipo Titulo"] for r in rows}))
active = {
    (r["Tipo Titulo"], r["Data Vencimento"])
    for r in rows
    if parse(r["Data Base"]) == latest and parse(r["Data Vencimento"]) > date.today()
}
print(f"Active titles: {len(active)}")
recent = sum(parse(r["Data Base"]) >= date.today() - timedelta(days=3652) for r in rows)
print(f"Rows in the last 10 years: {recent}")


def sgs(code, first, last):
    params = {
        "formato": "json",
        "dataInicial": first.strftime("%d/%m/%Y"),
        "dataFinal": last.strftime("%d/%m/%Y"),
    }
    begin = time.time()
    try:
        response = requests.get(SGS.format(code=code), params=params, timeout=60)
    except requests.RequestException as exc:
        return f"{type(exc).__name__} after {time.time() - begin:.1f}s"
    size = len(response.json()) if response.ok else response.text[:120]
    return f"HTTP {response.status_code} in {time.time() - begin:.1f}s, rows={size}"


today = date.today()
for years in (1, 3, 5):
    print(f"SGS 12, {years}y:", sgs(12, today - timedelta(days=365 * years), today))
print("SGS 433, 10y:", sgs(433, today - timedelta(days=3650), today))
print("SGS 433, no data:", sgs(433, today - timedelta(days=1), today))
print("SGS 12, weekend-only window:", sgs(12, date(2026, 10, 31), date(2026, 11, 1)))
