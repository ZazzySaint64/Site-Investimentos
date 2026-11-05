// Fixed income held outside the stock exchange. Pure: the value is calculated from the CDI, never saved.

import type { Position } from "./portfolio.ts";

export type FixedIncome = {
  id: number;
  name: string;
  principal: number;
  cdi_pct: number;
  start_date: string;
  maturity: string | null;
  daily_liquidity: boolean;
};

type Cdi = { date: string; value: number }[];

// CDI days after the start, up to today or maturity, whichever comes first.
function daysUsed(row: FixedIncome, cdi: Cdi, today: string): Cdi {
  const end = row.maturity && row.maturity < today ? row.maturity : today;
  return cdi.filter((point) => point.date > row.start_date && point.date <= end);
}

function grow(row: FixedIncome, days: Cdi): number {
  return days.reduce(
    (total, point) => total * (1 + (row.cdi_pct / 100) * (point.value / 100)),
    row.principal,
  );
}

export function fixedIncomeValue(row: FixedIncome, cdi: Cdi, today: string): number {
  return grow(row, daysUsed(row, cdi, today));
}

export function fixedIncomePositions(rows: FixedIncome[], cdi: Cdi, today: string): Position[] {
  return rows.map((row) => {
    const days = daysUsed(row, cdi, today);
    const value = grow(row, days);
    return {
      ticker: `RF-${row.id}`,
      name: row.name,
      assetClass: "renda_fixa",
      sector: null,
      active: true,
      quantity: 1,
      averageCost: row.principal,
      cost: row.principal,
      price: value,
      priceDate: days.length ? days[days.length - 1].date : null,
      value,
      result: value - row.principal,
      share: null,
      maturity: row.maturity,
    };
  });
}

/** Income tax on most fixed income by days held (Lei 11.033, art. 1º). IOF before 30 days is left out. */
export function regressiveTax(days: number): number {
  if (days <= 180) return 0.225;
  if (days <= 360) return 0.2;
  if (days <= 720) return 0.175;
  return 0.15;
}

/** The taxed rate that leaves the same after tax as a tax-exempt one, in the same unit. */
export function taxedEquivalent(exemptRate: number, days: number): number {
  return exemptRate / (1 - regressiveTax(days));
}

/** Price of a title that pays only at maturity, for each 1 it pays then. Rates as fractions a year. */
export function zeroCouponPrice(years: number, rate: number): number {
  return 1 / (1 + rate) ** years;
}

/** How much the price of such a title moves when market rates move by `shift`. */
export function priceChange(years: number, rate: number, shift: number): number {
  return zeroCouponPrice(years, rate + shift) / zeroCouponPrice(years, rate) - 1;
}

/** Modified duration of a title without coupons: about the % change for 1 point of rate. */
export function modifiedDuration(years: number, rate: number): number {
  return years / (1 + rate);
}
