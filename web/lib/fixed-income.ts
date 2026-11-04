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
