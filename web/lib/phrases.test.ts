import assert from "node:assert/strict";
import { test } from "node:test";
import {
  annualizedFromDaily,
  correlationPhrase,
  drawdownPhrase,
  formatDate,
  formatMoney,
  formatPercent,
  formatSignedPercent,
  returnPhrase,
  sharpePhrase,
  statusLabel,
  volatilityPhrase,
  yearTicks,
} from "./phrases.ts";

test("signed percent shows plus or the minus sign", () => {
  assert.equal(formatSignedPercent(0.1268), "+12,7%");
  assert.equal(formatSignedPercent(-0.391), "−39,1%");
  assert.equal(formatSignedPercent(null), "—");
});

test("percent, money and date use Brazilian format", () => {
  assert.equal(formatPercent(0.3101), "31,0%");
  assert.equal(formatPercent(null), "—");
  assert.match(formatMoney(1234.5), /^R\$\s1\.234,50$/);
  assert.equal(formatMoney(null), "—");
  assert.equal(formatDate("2026-11-03"), "03/11/2026");
});

test("return phrase says up or down and handles missing data", () => {
  assert.match(returnPhrase(0.2), /subiu/);
  assert.match(returnPhrase(-0.2), /caiu/);
  assert.match(returnPhrase(null), /menos de 12 meses/);
});

test("volatility phrase has three levels at the 15% and 30% limits", () => {
  assert.match(volatilityPhrase(0.14), /pouco/);
  assert.match(volatilityPhrase(0.15), /moderada/);
  assert.match(volatilityPhrase(0.29), /moderada/);
  assert.match(volatilityPhrase(0.3), /muito/);
  assert.match(volatilityPhrase(null), /menos de 12 meses/);
});

test("sharpe phrase compares with the CDI", () => {
  assert.match(sharpePhrase(-0.5), /menos que o CDI/);
  assert.match(sharpePhrase(0.5), /acima do CDI/);
  assert.match(sharpePhrase(1.5), /bem acima do CDI/);
  assert.match(sharpePhrase(null), /Sem dados/);
});

test("drawdown phrase shows the size of the fall without a sign", () => {
  assert.match(drawdownPhrase(-0.391), /39,1%/);
  assert.match(drawdownPhrase(null), /Sem dados/);
});

test("correlation phrase has three levels", () => {
  assert.match(correlationPhrase(0.8), /junto/);
  assert.match(correlationPhrase(0.5), /em parte/);
  assert.match(correlationPhrase(0.1), /pouca relação/);
  assert.match(correlationPhrase(null), /Sem dados/);
});

test("status label never relies on color alone", () => {
  assert.equal(statusLabel("success"), "✓ Tudo certo");
  assert.equal(statusLabel("partial"), "! Concluído com avisos");
  assert.equal(statusLabel("failed"), "✕ Falhou");
  assert.equal(statusLabel("running"), "… Em andamento");
});

test("daily rate becomes an annual rate over 252 days", () => {
  assert.ok(Math.abs(annualizedFromDaily(0.05) - (1.0005 ** 252 - 1)) < 1e-12);
});

test("year ticks keep the first date of each year", () => {
  const dates = ["2024-11-29", "2025-01-02", "2025-06-10", "2026-01-05", "2026-03-01"];
  assert.deepEqual(yearTicks(dates), ["2025-01-02", "2026-01-05"]);
});

test("year ticks are empty for less than three years of data", () => {
  assert.deepEqual(yearTicks(["2025-06-01", "2026-01-05"]), []);
});

test("return phrase does not claim five years when the history is shorter", () => {
  assert.doesNotMatch(returnPhrase(0.2), /últimos 5 anos/);
  assert.match(returnPhrase(0.2), /até 5 anos/);
});
