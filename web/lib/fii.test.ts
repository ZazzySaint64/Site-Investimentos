import assert from "node:assert/strict";
import { test } from "node:test";
import {
  adminFee,
  amortizationMonths,
  dividendPhrase,
  dividendYield,
  fundKind,
  leaseBands,
  priceToBook,
  priceToBookPhrase,
  type FiiMonth,
  type FiiQuarter,
} from "./fii.ts";

function month(shares: Partial<FiiMonth> = {}): FiiMonth {
  return {
    month: "2026-09-01",
    book_value: 100,
    holders: 1000,
    admin_fee: 0.001,
    amortization: 0,
    share_buildings: 0,
    share_development: 0,
    share_paper: 0,
    share_funds: 0,
    share_other: 0,
    ...shares,
  };
}

test("a fund takes the type of the group with two thirds of the holdings", () => {
  assert.equal(fundKind(month({ share_buildings: 0.85, share_other: 0.15 }))?.kind, "tijolo");
  assert.equal(fundKind(month({ share_paper: 0.75, share_funds: 0.14 }))?.kind, "papel");
  assert.equal(fundKind(month({ share_funds: 1 }))?.kind, "fundos");
  assert.equal(fundKind(month({ share_development: 0.7 }))?.kind, "desenvolvimento");
});

test("below two thirds the fund is mixed, and says which part is largest", () => {
  const kind = fundKind(month({ share_buildings: 0.64, share_funds: 0.29 }));
  assert.deepEqual(kind, {
    kind: "misto",
    main: "share_buildings",
    share: 0.64,
  });
});

test("a fund with nothing reported has no type", () => {
  assert.equal(fundKind(month({ share_other: 1 })), null);
});

test("dividend yield adds the last 12 months of payments over the last price", () => {
  const dividends = [
    { date: "2025-09-30", amount: 5 },
    { date: "2025-10-01", amount: 1 },
    { date: "2026-03-01", amount: 1 },
    { date: "2026-09-30", amount: 1 },
    { date: "2026-10-01", amount: 9 },
  ];
  const result = dividendYield(dividends, { close: 100, date: "2026-09-30" });
  assert.deepEqual(result, {
    value: 0.03,
    payments: 3,
    total: 3,
    since: "2025-09-30",
  });
});

test("without payments in the year the yield is unknown, not zero", () => {
  assert.equal(dividendYield([], { close: 100, date: "2026-09-30" }), null);
  assert.equal(dividendYield([{ date: "2026-01-01", amount: 1 }], null), null);
});

test("price to book needs a positive book value", () => {
  assert.equal(priceToBook(97, 100), 0.97);
  assert.equal(priceToBook(97, null), null);
  assert.equal(priceToBook(null, 100), null);
});

test("price to book phrases never call a fund cheap or expensive", () => {
  for (const value of [0.8, 1.2]) {
    const phrase = priceToBookPhrase(value);
    assert.match(phrase, /não prova/);
    assert.doesNotMatch(phrase.replace(/não prova que está (barato|caro)/, ""), /barat|car[oa]\b/);
  }
  assert.match(priceToBookPhrase(0.97), /R\$ 0,97 por R\$ 1,00/);
});

test("admin fee adds up to the last 12 months that were reported", () => {
  const months = Array.from({ length: 13 }, (_, i) => month({ admin_fee: i === 0 ? 1 : 0.001 }));
  months[12].admin_fee = null;
  const fee = adminFee(months);
  assert.equal(fee?.months, 11);
  assert.ok(Math.abs(fee!.value - 0.011) < 1e-12);
  assert.equal(adminFee([month({ admin_fee: null })]), null);
});

test("amortization counts only months that returned capital", () => {
  assert.equal(amortizationMonths([month(), month({ amortization: 0.02 })]), 1);
});

function quarter(bands: Partial<FiiQuarter>): FiiQuarter {
  return {
    quarter: "2026-06-30",
    buildings: 3,
    vacancy: 0,
    vacancy_doubtful: false,
    default_rate: 0,
    lease_12m: null,
    lease_24m: null,
    lease_36m: null,
    lease_over_36m: null,
    lease_undetermined: null,
    tenant_sectors: [],
    ...bands,
  };
}

test("lease bands are shown as parts of what was reported", () => {
  const bands = leaseBands(
    quarter({
      lease_12m: 0.2,
      lease_24m: 0.1,
      lease_36m: 0.05,
      lease_over_36m: 0.4,
      lease_undetermined: 0.05,
    }),
  );
  assert.deepEqual(
    bands?.map((band) => Math.round(band.share * 100)),
    [25, 13, 6, 50, 6],
  );
  assert.equal(leaseBands(quarter({})), null);
});

test("the dividend phrase says the period and that it looks at the past", () => {
  const phrase = dividendPhrase(
    { value: 0.1, payments: 12, total: 10.5, since: "2025-09-30" },
    "cota",
  );
  assert.match(phrase, /R\$\s10,50 por cota em 12 pagamentos desde 30\/09\/2025/);
  assert.match(phrase, /passado/);
  assert.match(dividendPhrase(null, "ação"), /Sem pagamentos/);
});
