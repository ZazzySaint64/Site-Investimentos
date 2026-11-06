// Sums for the first steps: an emergency reserve and monthly contributions. Pure functions.
// Rates are fractions per year unless the name says otherwise.

/** Months of essential expenses that guides commonly suggest. No official rule sets them. */
export const RESERVE_MONTHS = {
  stable: { min: 3, max: 6 },
  variable: { min: 6, max: 12 },
} as const;

export function monthlyRate(annualRate: number): number {
  return (1 + annualRate) ** (1 / 12) - 1;
}

/** What is left above inflation: (1 + rate) / (1 + inflation) − 1. */
export function realRate(rate: number, inflation: number): number {
  return (1 + rate) / (1 + inflation) - 1;
}

/** Months to go from `saved` to `target` putting `monthly` aside each month. Null if never. */
export function monthsToReach(
  target: number,
  saved: number,
  monthly: number,
  annualRate: number,
): number | null {
  if (saved >= target) return 0;
  if (monthly <= 0 && annualRate <= 0) return null;
  const i = monthlyRate(annualRate);
  let balance = saved;
  for (let month = 1; month <= 1200; month++) {
    balance = balance * (1 + i) + monthly;
    if (balance >= target) return month;
  }
  return null;
}

export type YearPoint = { year: number; contributed: number; total: number };

/** The balance at the end of each year, contributing at the end of each month. */
export function growthByYear(
  initial: number,
  monthly: number,
  years: number,
  annualRate: number,
): YearPoint[] {
  const i = monthlyRate(annualRate);
  const points: YearPoint[] = [{ year: 0, contributed: initial, total: initial }];
  let total = initial;
  for (let month = 1; month <= years * 12; month++) {
    total = total * (1 + i) + monthly;
    if (month % 12 === 0) {
      points.push({ year: month / 12, contributed: initial + monthly * month, total });
    }
  }
  return points;
}

/**
 * What the CDI paid above the IPCA in each complete calendar year, from the daily CDI and the
 * monthly IPCA, both in percent as the Banco Central publishes them.
 */
export function realCdiByYear(
  cdi: { date: string; value: number }[],
  ipca: { date: string; value: number }[],
): { year: number; real: number }[] {
  const cdiYears = new Map<number, number>();
  for (const point of cdi) {
    const year = Number(point.date.slice(0, 4));
    cdiYears.set(year, (cdiYears.get(year) ?? 1) * (1 + point.value / 100));
  }
  const ipcaYears = new Map<number, { growth: number; months: Set<number> }>();
  for (const point of ipca) {
    const year = Number(point.date.slice(0, 4));
    const entry = ipcaYears.get(year) ?? { growth: 1, months: new Set<number>() };
    entry.growth *= 1 + point.value / 100;
    entry.months.add(Number(point.date.slice(5, 7)));
    ipcaYears.set(year, entry);
  }
  const firstCdiYear = Math.min(...cdiYears.keys());
  return [...ipcaYears.entries()]
    .filter(
      ([year, entry]) => entry.months.size === 12 && cdiYears.has(year) && year > firstCdiYear,
    )
    .map(([year, entry]) => ({ year, real: cdiYears.get(year)! / entry.growth - 1 }))
    .sort((a, b) => a.year - b.year);
}

/** Reads money typed the Brazilian way: "1.500", "1.500,50" or "1500,5". Null if not a number. */
export function parseMoney(text: string): number | null {
  const clean = text.replace(/R\$|\s/g, "");
  if (!clean) return null;
  const value = Number(clean.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(value) && value >= 0 ? value : null;
}
