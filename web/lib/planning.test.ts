import assert from "node:assert/strict";
import { test } from "node:test";
import {
  growthByYear,
  monthlyRate,
  monthsToReach,
  parseMoney,
  realCdiByYear,
  realRate,
} from "./planning.ts";

const close = (a: number, b: number, digits = 6) =>
  assert.equal(a.toFixed(digits), b.toFixed(digits));

test("a monthly rate compounds back to the yearly one", () => {
  close((1 + monthlyRate(0.12)) ** 12 - 1, 0.12);
});

test("12% with 5% inflation leaves about 6.67% above inflation", () => {
  close(realRate(0.12, 0.05), 0.0666667, 6);
});

test("months to the target with and without interest", () => {
  assert.equal(monthsToReach(6000, 0, 1000, 0), 6);
  assert.equal(monthsToReach(6000, 6000, 0, 0.1), 0);
  assert.ok(monthsToReach(6000, 0, 1000, 0.12)! <= 6);
  assert.equal(monthsToReach(6000, 100, 0, 0), null);
});

test("growth by year adds the contributions and the interest", () => {
  const flat = growthByYear(1000, 100, 2, 0);
  assert.deepEqual(flat.at(-1), { year: 2, contributed: 3400, total: 3400 });
  const grown = growthByYear(0, 100, 10, 0.05);
  assert.equal(grown.length, 11);
  assert.ok(grown.at(-1)!.total > grown.at(-1)!.contributed);
});

test("real CDI by year uses only complete years of both series", () => {
  const cdi = [
    { date: "2023-12-29", value: 0.04 },
    ...Array.from({ length: 2 }, (_, i) => ({ date: `2024-0${i + 1}-02`, value: 1 })),
    { date: "2025-03-03", value: 1 },
  ];
  const ipca = [
    ...Array.from({ length: 12 }, (_, i) => ({
      date: `2024-${String(i + 1).padStart(2, "0")}-01`,
      value: 0,
    })),
    { date: "2025-01-01", value: 0.5 },
  ];
  const years = realCdiByYear(cdi, ipca);
  assert.deepEqual(
    years.map((item) => item.year),
    [2024],
  );
  close(years[0].real, 1.01 * 1.01 - 1);
});

test("money is read the Brazilian way", () => {
  assert.equal(parseMoney("1.500"), 1500);
  assert.equal(parseMoney("R$ 1.500,50"), 1500.5);
  assert.equal(parseMoney("300"), 300);
  assert.equal(parseMoney(""), null);
  assert.equal(parseMoney("abc"), null);
});
