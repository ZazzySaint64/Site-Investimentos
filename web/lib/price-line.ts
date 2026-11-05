// A plain price line for the home page sheet, drawn without a chart library.

export type PricePoint = { date: string; close: number };

const YEARS_SHOWN = 5;
const MAX_POINTS = 120;

/** The last 5 years, thinned out but always keeping the newest point. */
export function lastYears(prices: PricePoint[]): PricePoint[] {
  const newest = prices.at(-1);
  if (!newest) return [];
  const year = Number(newest.date.slice(0, 4)) - YEARS_SHOWN;
  const since = `${year}${newest.date.slice(4)}`;
  const recent = prices.filter((point) => point.date >= since);
  const step = Math.ceil(recent.length / MAX_POINTS) || 1;
  return recent.filter((_, index) => index % step === 0 || index === recent.length - 1);
}

/** SVG points in a width × height box. The lowest price touches the bottom and the highest the top. */
export function linePoints(closes: number[], width: number, height: number): string {
  const low = Math.min(...closes);
  const range = Math.max(...closes) - low || 1;
  const last = Math.max(closes.length - 1, 1);
  return closes
    .map((close, index) => {
      const x = (index / last) * width;
      const y = height - ((close - low) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}
