import assert from "node:assert/strict";
import { test } from "node:test";
import { lastYears, linePoints } from "./price-line.ts";

test("the line runs from bottom to top of the box", () => {
  assert.equal(linePoints([10, 20, 15], 100, 50), "0.0,50.0 50.0,0.0 100.0,25.0");
});

test("a flat price does not divide by zero", () => {
  assert.equal(linePoints([10, 10], 100, 50), "0.0,50.0 100.0,50.0");
});

test("only the last 5 years stay, and the newest point is never dropped", () => {
  const prices = [
    { date: "2020-01-01", close: 1 },
    { date: "2021-11-01", close: 2 },
    { date: "2026-11-01", close: 3 },
  ];
  assert.deepEqual(
    lastYears(prices).map((point) => point.close),
    [2, 3],
  );
  const many = Array.from({ length: 1000 }, (_, index) => ({ date: "2026-01-01", close: index }));
  const thinned = lastYears(many);
  assert.ok(thinned.length <= 121);
  assert.equal(thinned.at(-1)?.close, 999);
});

test("no prices give no line", () => {
  assert.deepEqual(lastYears([]), []);
});
