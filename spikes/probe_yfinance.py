# Throwaway: checks whether yfinance serves every market, locally and on GitHub Actions.
import os
import time

import yfinance as yf

SYMBOLS = ["PETR4.SA", "HGLG11.SA", "MGLU3.SA", "AAPL", "BTC-USD", "USDBRL=X", "^BVSP", "^GSPC"]

lines = [
    "| Symbol | Rows | First | Last | Splits | Seconds | Columns |",
    "|---|---:|---|---|---:|---:|---|",
]
failed = []
frames = {}
for symbol in SYMBOLS:
    start = time.time()
    try:
        df = yf.Ticker(symbol).history(period="10y", auto_adjust=False, actions=True)
    except Exception as exc:
        lines.append(f"| {symbol} | ERROR {exc!r} | | | | | |")
        failed.append(symbol)
        continue
    elapsed = time.time() - start
    if df.empty:
        lines.append(f"| {symbol} | 0 | | | | {elapsed:.1f} | |")
        failed.append(symbol)
        continue
    frames[symbol] = df
    splits = int((df["Stock Splits"] != 0).sum()) if "Stock Splits" in df else "n/a"
    lines.append(
        f"| {symbol} | {len(df)} | {df.index[0].date()} | {df.index[-1].date()} | {splits} "
        f"| {elapsed:.1f} | {', '.join(df.columns)} |"
    )

lines.append("")
if "AAPL" in frames:
    aapl = frames["AAPL"]
    aapl.index = aapl.index.tz_localize(None)
    lines.append(f"AAPL Close 2020-08-28: {aapl.loc['2020-08-28', 'Close']:.2f}")
    lines.append(f"AAPL Adj Close 2020-08-28: {aapl.loc['2020-08-28', 'Adj Close']:.2f}")
    lines.append(f"AAPL split 2020-08-31: {aapl.loc['2020-08-31', 'Stock Splits']}")
lines.append(f"Failed: {failed or 'none'}")

report = "\n".join(lines)
print(report)
if summary := os.environ.get("GITHUB_STEP_SUMMARY"):
    with open(summary, "a", encoding="utf-8") as fh:
        fh.write(report + "\n")
raise SystemExit(1 if failed else 0)
# run 2
# run 3
