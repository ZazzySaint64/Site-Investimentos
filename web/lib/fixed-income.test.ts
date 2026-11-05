import assert from "node:assert/strict";
import { test } from "node:test";
import {
  fixedIncomeValue,
  modifiedDuration,
  priceChange,
  regressiveTax,
  taxedEquivalent,
  zeroCouponPrice,
} from "./fixed-income.ts";

const cdb = {
  id: 1,
  name: "CDB",
  principal: 1000,
  cdi_pct: 100,
  start_date: "2024-01-01",
  maturity: null,
  daily_liquidity: true,
};
const cdi = [
  { date: "2024-01-01", value: 0.05 },
  { date: "2024-01-02", value: 0.05 },
  { date: "2024-01-03", value: 0.05 },
  { date: "2024-01-04", value: 0.05 },
];
const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-6, `${a} != ${b}`);

test("value grows from the day after the start up to today", () => {
  near(fixedIncomeValue(cdb, cdi, "2024-01-03"), 1000 * 1.0005 ** 2);
});
test("the percentage applies to each day of CDI", () => {
  near(fixedIncomeValue({ ...cdb, cdi_pct: 120 }, cdi, "2024-01-03"), 1000 * 1.0006 ** 2);
});
test("value stops at maturity", () => {
  near(fixedIncomeValue({ ...cdb, maturity: "2024-01-02" }, cdi, "2024-01-04"), 1000 * 1.0005);
});
test("no CDI after the start keeps the principal", () => {
  assert.equal(fixedIncomeValue(cdb, [], "2024-01-03"), 1000);
});

test("income tax falls with the days held", () => {
  assert.deepEqual(
    [1, 180, 181, 360, 361, 720, 721].map(regressiveTax),
    [0.225, 0.225, 0.2, 0.2, 0.175, 0.175, 0.15],
  );
});

test("an exempt 12% equals a taxed 14.12% after two years", () => {
  assert.equal(Math.round(taxedEquivalent(0.12, 800) * 10000) / 100, 14.12);
});

test("the research example: R$ 1.000 in 10 years at 13% and then 14%", () => {
  assert.equal(Math.round(zeroCouponPrice(10, 0.13) * 100000) / 100, 294.59);
  assert.equal(Math.round(zeroCouponPrice(10, 0.14) * 100000) / 100, 269.74);
  assert.equal(Math.round(priceChange(10, 0.13, 0.01) * 1000) / 10, -8.4);
});

test("a longer title moves more, and a falling rate raises the price", () => {
  assert.ok(Math.abs(priceChange(10, 0.13, 0.01)) > Math.abs(priceChange(2, 0.13, 0.01)));
  assert.ok(priceChange(5, 0.13, -0.01) > 0);
  assert.equal(Math.round(modifiedDuration(10, 0.13) * 100) / 100, 8.85);
});
