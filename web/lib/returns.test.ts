import assert from "node:assert/strict";
import { test } from "node:test";
import type { Transaction } from "./portfolio.ts";
import { dailyGrowth, dividendsReceived, monthlyGrowth, sameMoneyIn } from "./returns.ts";

let nextId = 1;
function move(
  type: "buy" | "sell",
  quantity: number,
  price: number,
  date: string,
  splits: { date: string; ratio: number }[] = [],
): Transaction {
  return {
    id: nextId++,
    type,
    quantity,
    price,
    date,
    asset: { ticker: "A", name: "A", class: "fii", sector: null, active: true, prices: [], splits },
  };
}

const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test("dividends count the shares held before the ex-date", () => {
  const moves = [move("buy", 10, 10, "2025-01-10"), move("sell", 4, 12, "2025-03-10")];
  const payments = new Map([
    [
      "A",
      [
        { date: "2025-01-10", amount: 9 }, // bought on the ex-date: not received
        { date: "2025-02-10", amount: 1 }, // 10 shares
        { date: "2025-03-10", amount: 1 }, // sold on the ex-date: still 10 shares
        { date: "2025-04-10", amount: 1 }, // 6 shares
        { date: "2027-01-10", amount: 5 }, // after today
      ],
    ],
  ]);
  const received = dividendsReceived(moves, payments, "2026-03-01").get("A")!;
  close(received.total, 26);
  close(received.lastYear, 16); // after 2025-03-01
});

test("a later split turns old shares into today's shares", () => {
  const moves = [move("buy", 10, 100, "2025-01-10", [{ date: "2025-06-01", ratio: 10 }])];
  const received = dividendsReceived(
    moves,
    new Map([["A", [{ date: "2025-02-10", amount: 0.1 }]]]),
    "2026-01-01",
  );
  close(received.get("A")!.total, 10);
});

test("an asset with no payment saved is left out, not zero", () => {
  const moves = [move("buy", 10, 10, "2025-01-10")];
  assert.equal(dividendsReceived(moves, new Map([["A", []]]), "2026-01-01").has("A"), false);
});

test("the index grows after the day of the purchase only", () => {
  const cdi = [
    { date: "2025-01-02", value: 1 },
    { date: "2025-01-03", value: 1 },
  ];
  close(dailyGrowth(cdi, "2025-01-02"), 1.01);
  const ipca = [
    { date: "2025-01-01", value: 10 },
    { date: "2025-02-01", value: 10 },
  ];
  close(monthlyGrowth(ipca, "2025-01-20"), 1.1);
});

test("the same money in the index follows purchases and sales", () => {
  const moves = [move("buy", 10, 10, "2025-01-01"), move("sell", 5, 10, "2025-06-01")];
  const growth = (date: string) => (date === "2025-01-01" ? 1.2 : 1.1);
  close(sameMoneyIn(moves, growth)!, 120 - 55);
  assert.equal(
    sameMoneyIn([move("buy", 1, 10, "2025-01-01"), move("sell", 1, 50, "2025-06-01")], () => 1),
    null,
  );
});
