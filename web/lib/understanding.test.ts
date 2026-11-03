import assert from "node:assert/strict";
import { test } from "node:test";
import { GLOSSARY } from "./glossary.ts";
import {
  accumulatedFromMonthly,
  formatMonthYear,
  formatSignedPercent,
  growthOfThousand,
  riskLabel,
  runSummary,
} from "./phrases.ts";

const price = (date: string, adj_close: number) => ({ date, close: adj_close, adj_close });

test("risk label follows the same limits as the volatility phrase", () => {
  assert.equal(riskLabel(0.14), "Baixa");
  assert.equal(riskLabel(0.15), "Média");
  assert.equal(riskLabel(0.3), "Alta");
  assert.equal(riskLabel(null), "—");
});

test("monthly inflation accumulates by compounding", () => {
  assert.ok(Math.abs(accumulatedFromMonthly([1, 1]) - 0.0201) < 1e-9);
  assert.equal(accumulatedFromMonthly([]), 0);
});

test("month and year are written the Brazilian way", () => {
  assert.equal(formatMonthYear("2021-11-03"), "nov/2021");
});

test("growth uses the last five years of adjusted prices", () => {
  const prices = [
    price("2015-01-02", 1),
    price("2021-11-03", 10),
    price("2024-01-02", 15),
    price("2026-11-03", 20),
  ];
  const cdi = [
    { series: "cdi", date: "2020-01-02", value: 50 },
    { series: "cdi", date: "2022-01-03", value: 10 },
    { series: "cdi", date: "2023-01-03", value: 10 },
  ];
  const result = growthOfThousand(prices, cdi);
  assert.equal(result?.since, "2021-11-03");
  assert.equal(Math.round(result?.asset ?? 0), 2000);
  assert.equal(Math.round(result?.cdi ?? 0), 1210);
});

test("growth is not shown with less than one year of prices", () => {
  const prices = [price("2026-02-02", 10), price("2026-11-03", 20)];
  assert.equal(growthOfThousand(prices, []), null);
});

test("growth works with a short history above one year", () => {
  const prices = [price("2023-01-09", 10), price("2026-10-30", 15)];
  assert.equal(growthOfThousand(prices, [])?.since, "2023-01-09");
});

test("growth has no CDI value when the series is missing", () => {
  const prices = [price("2021-11-03", 10), price("2026-11-03", 20)];
  assert.equal(growthOfThousand(prices, [])?.cdi, null);
});

test("run summary explains what happened in plain words", () => {
  assert.equal(runSummary({}), "Tudo foi atualizado.");
  assert.equal(
    runSummary({ rejected: [{ ticker: "A", date: "2026-01-01", reason: "x" }] }),
    "1 preço com erro na fonte foi descartado.",
  );
  assert.equal(
    runSummary({
      failed: ["A", "B"],
      rejected: [
        { ticker: "A", date: "2026-01-01", reason: "x" },
        { ticker: "A", date: "2026-01-02", reason: "x" },
      ],
    }),
    "2 itens não foram atualizados. 2 preços com erro na fonte foram descartados.",
  );
  assert.equal(runSummary({ error: "boom" }), "A atualização parou por um erro.");
});

test("every glossary entry has a title and an explanation", () => {
  for (const [key, entry] of Object.entries(GLOSSARY)) {
    assert.ok(entry.title.length > 0, key);
    assert.ok(entry.text.length > 20, key);
  }
});

test("a value that rounds to zero has no sign", () => {
  assert.equal(formatSignedPercent(-0.0002), "0,0%");
  assert.equal(formatSignedPercent(0.0002), "0,0%");
});
