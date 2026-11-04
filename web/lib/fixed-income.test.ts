import assert from "node:assert/strict";
import { test } from "node:test";
import { fixedIncomeValue } from "./fixed-income.ts";

const cdb = { id: 1, name: "CDB", principal: 1000, cdi_pct: 100, start_date: "2024-01-01", maturity: null, daily_liquidity: true };
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
