import assert from "node:assert/strict";
import { test } from "node:test";
import { fixedIncomePositions } from "./fixed-income.ts";
import { computePortfolio, hasLaterSplit, type Transaction } from "./portfolio.ts";

type Options = {
  close?: number | null;
  splits?: { date: string; ratio: number }[];
  active?: boolean;
  assetClass?: string;
};

let nextId = 1;

function transaction(
  type: "buy" | "sell",
  ticker: string,
  quantity: number,
  price: number,
  date: string,
  { close = 100, splits = [], active = true, assetClass = "acao_br" }: Options = {},
): Transaction {
  return {
    id: nextId++,
    type,
    quantity,
    price,
    date,
    asset: {
      ticker,
      name: ticker,
      class: assetClass,
      sector: null,
      active,
      prices: close === null ? [] : [{ close, date: "2026-11-03" }],
      splits,
    },
  };
}

const buy = (ticker: string, quantity: number, price: number, date: string, options?: Options) =>
  transaction("buy", ticker, quantity, price, date, options);
const sell = (ticker: string, quantity: number, price: number, date: string, options?: Options) =>
  transaction("sell", ticker, quantity, price, date, options);

test("partial sale keeps the average cost and adds to the realized result", () => {
  const p = computePortfolio([
    buy("A", 10, 100, "2024-01-01", { close: 200 }),
    sell("A", 4, 150, "2024-06-01", { close: 200 }),
  ]);
  const position = p.positions[0];
  assert.equal(position.quantity, 6);
  assert.equal(position.averageCost, 100);
  assert.equal(position.cost, 600);
  assert.equal(position.value, 1200);
  assert.equal(position.result, 600);
  assert.equal(p.invested, 600);
  assert.equal(p.value, 1200);
  assert.equal(p.realized, 200);
  assert.equal(p.result, 800);
  assert.equal(p.resultShare, 0.8);
});

test("second purchase changes the average cost", () => {
  const p = computePortfolio([buy("A", 10, 100, "2024-01-01"), buy("A", 10, 200, "2024-02-01")]);
  assert.equal(p.positions[0].quantity, 20);
  assert.equal(p.positions[0].averageCost, 150);
});

test("split after the purchase corrects quantity and price", () => {
  const options = { close: 60, splits: [{ date: "2024-06-01", ratio: 2 }] };
  const p = computePortfolio([buy("A", 10, 100, "2024-01-01", options)]);
  assert.equal(p.positions[0].quantity, 20);
  assert.equal(p.positions[0].averageCost, 50);
  assert.equal(p.positions[0].value, 1200);
  assert.equal(p.result, 200);
});

test("split on or before the purchase date is ignored", () => {
  const splits = [
    { date: "2024-01-01", ratio: 2 },
    { date: "2023-06-01", ratio: 3 },
  ];
  const p = computePortfolio([buy("A", 10, 100, "2024-01-01", { splits })]);
  assert.equal(p.positions[0].quantity, 10);
});

test("reverse split with ratio below one", () => {
  const splits = [{ date: "2024-05-27", ratio: 0.1 }];
  const p = computePortfolio([buy("A", 2000, 3, "2023-03-15", { close: 5, splits })]);
  assert.equal(p.positions[0].quantity, 200);
  assert.ok(Math.abs(p.positions[0].averageCost - 30) < 1e-9);
});

test("sale after a split uses the corrected units", () => {
  const options = { close: 60, splits: [{ date: "2024-06-01", ratio: 2 }] };
  const p = computePortfolio([
    buy("A", 10, 100, "2024-01-01", options),
    sell("A", 5, 70, "2024-07-01", options),
  ]);
  assert.equal(p.positions[0].quantity, 15);
  assert.equal(p.realized, 100);
});

test("position sold completely disappears but the realized result stays", () => {
  const p = computePortfolio([buy("A", 10, 100, "2024-01-01"), sell("A", 10, 130, "2024-06-01")]);
  assert.equal(p.positions.length, 0);
  assert.equal(p.realized, 300);
  assert.equal(p.result, 300);
  assert.equal(p.value, 0);
});

test("on the same day, buys count before sells whatever the array order", () => {
  const p = computePortfolio([sell("A", 5, 120, "2024-01-01"), buy("A", 10, 100, "2024-01-01")]);
  assert.equal(p.positions[0].quantity, 5);
  assert.equal(p.realized, 100);
});

test("asset without price is left out of the totals and reported", () => {
  const p = computePortfolio([
    buy("A", 10, 100, "2024-01-01", { close: 150 }),
    buy("B", 10, 100, "2024-01-01", { close: null }),
  ]);
  const missing = p.positions.find((position) => position.ticker === "B");
  assert.equal(missing?.price, null);
  assert.equal(missing?.value, null);
  assert.equal(missing?.result, null);
  assert.equal(missing?.share, null);
  assert.equal(p.value, 1500);
  assert.equal(p.result, 500);
  assert.deepEqual(p.missingPrices, ["B"]);
  assert.ok(Number.isFinite(p.resultShare));
});

test("inactive asset keeps the last price and the flag", () => {
  const p = computePortfolio([buy("A", 10, 100, "2024-01-01", { close: 90, active: false })]);
  assert.equal(p.positions[0].active, false);
  assert.equal(p.positions[0].price, 90);
  assert.equal(p.positions[0].priceDate, "2026-11-03");
  assert.equal(p.value, 900);
});

test("shares and allocation add up to one", () => {
  const p = computePortfolio([
    buy("A", 10, 100, "2024-01-01", { close: 100 }),
    buy("B", 10, 100, "2024-01-01", { close: 100 }),
    buy("C", 20, 100, "2024-01-01", { close: 100, assetClass: "tesouro" }),
  ]);
  const shares = p.positions.reduce((total, position) => total + (position.share ?? 0), 0);
  assert.ok(Math.abs(shares - 1) < 1e-9);
  // Both classes have the same value here, so their order does not matter.
  assert.deepEqual(
    p.allocation
      .map(({ assetClass, value, share }) => [assetClass, value, share])
      .sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
    [
      ["acao_br", 2000, 0.5],
      ["tesouro", 2000, 0.5],
    ],
  );
});

test("allocation comes with the largest class first", () => {
  const p = computePortfolio([
    buy("A", 1, 100, "2024-01-01", { close: 100 }),
    buy("C", 2, 100, "2024-01-01", { close: 100, assetClass: "tesouro" }),
  ]);
  assert.equal(p.allocation[0].assetClass, "tesouro");
});

test("positions come with the largest value first and no price last", () => {
  const p = computePortfolio([
    buy("NOPRICE", 100, 100, "2024-01-01", { close: null }),
    buy("SMALL", 1, 100, "2024-01-01", { close: 100 }),
    buy("BIG", 10, 100, "2024-01-01", { close: 100 }),
  ]);
  assert.deepEqual(
    p.positions.map((position) => position.ticker),
    ["BIG", "SMALL", "NOPRICE"],
  );
});

test("empty list gives zeros", () => {
  const p = computePortfolio([]);
  assert.deepEqual([p.value, p.result, p.resultShare, p.positions.length], [0, 0, 0, 0]);
  assert.deepEqual(p.allocation, []);
});

test("asset without price stays out of the invested amount and the result share", () => {
  const p = computePortfolio([
    buy("A", 10, 100, "2024-01-01", { close: 150 }),
    buy("B", 10, 100, "2024-01-01", { close: null }),
  ]);
  assert.equal(p.invested, 1000);
  assert.equal(p.resultShare, 0.5);
});

test("sold asset still counts in the total bought when it has no price", () => {
  const p = computePortfolio([
    buy("A", 10, 100, "2024-01-01", { close: null }),
    sell("A", 10, 120, "2024-06-01", { close: null }),
  ]);
  assert.equal(p.result, 200);
  assert.equal(p.resultShare, 0.2);
});

test("hasLaterSplit tells when the quantity changed after the operation", () => {
  const splits = [{ date: "2024-06-01", ratio: 2 }];
  assert.equal(hasLaterSplit(buy("A", 10, 100, "2024-01-01", { splits })), true);
  assert.equal(hasLaterSplit(buy("A", 10, 100, "2024-06-01", { splits })), false);
  assert.equal(hasLaterSplit(buy("A", 10, 100, "2024-01-01")), false);
});

const cdb = { id: 1, name: "CDB", principal: 1000, cdi_pct: 100, start_date: "2024-01-01", maturity: null, daily_liquidity: true };
const cdi = [
  { date: "2024-01-01", value: 0.05 },
  { date: "2024-01-02", value: 0.05 },
  { date: "2024-01-03", value: 0.05 },
  { date: "2024-01-04", value: 0.05 },
];
const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-6, `${a} != ${b}`);

test("fixed income joins totals, allocation and shares", () => {
  const [extra] = fixedIncomePositions([cdb], [], "2024-01-03");
  const p = computePortfolio([buy("A", 10, 100, "2024-01-01", { close: 100 })], [extra]);
  assert.equal(p.value, 2000);
  assert.equal(p.invested, 2000);
  assert.equal(p.positions.find((x) => x.assetClass === "renda_fixa")?.share, 0.5);
  assert.deepEqual(p.allocation.map((x) => x.share), [0.5, 0.5]);
});

test("only fixed income works and result share uses the principal", () => {
  const [extra] = fixedIncomePositions([cdb], cdi, "2024-01-03");
  const p = computePortfolio([], [extra]);
  near(p.result, 1000 * 1.0005 ** 2 - 1000);
  near(p.resultShare, 1.0005 ** 2 - 1);
});

test("fractional split residue does not leave a ghost position", () => {
  // buy 10, ratio 1/3, then sell 3.333333: less than 1e-6 is left
  const p = computePortfolio([
    buy("A", 10, 100, "2024-01-01", { close: 100, splits: [{ date: "2024-06-01", ratio: 1 / 3 }] }),
    sell("A", 3.333333, 300, "2024-07-01", { close: 100, splits: [{ date: "2024-06-01", ratio: 1 / 3 }] }),
  ]);
  assert.equal(p.positions.length, 0);
});
