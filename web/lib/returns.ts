// Dividends received and a comparison with the CDI and the IPCA, from the transactions. Pure.

import { laterSplitFactor, type Transaction } from "./portfolio.ts";

type Payment = { date: string; amount: number }; // amount per share, in today's shares
type Point = { date: string; value: number }; // percent, as the Banco Central publishes

export type Received = { total: number; lastYear: number };

function yearBefore(isoDate: string): string {
  return `${Number(isoDate.slice(0, 4)) - 1}${isoDate.slice(4)}`;
}

/**
 * Dividends per ticker: each payment times the shares held before its ex-date. Buying on the
 * ex-date does not receive it, selling on the ex-date still does. Tickers with no payment in the
 * database at all are left out, so the page can say "não informado".
 */
export function dividendsReceived(
  transactions: Transaction[],
  payments: Map<string, Payment[]>,
  today: string,
): Map<string, Received> {
  const received = new Map<string, Received>();
  const since = yearBefore(today);
  for (const [ticker, list] of payments) {
    const own = transactions.filter((transaction) => transaction.asset.ticker === ticker);
    if (!list.length || !own.length) continue;
    const entry = { total: 0, lastYear: 0 };
    // ponytail: scans every transaction per payment; fine for a personal wallet
    for (const payment of list) {
      if (payment.date > today) continue;
      const shares = own
        .filter((transaction) => transaction.date < payment.date)
        .reduce(
          (total, transaction) =>
            total +
            (transaction.type === "buy" ? 1 : -1) *
              transaction.quantity *
              laterSplitFactor(transaction),
          0,
        );
      if (shares <= 1e-6) continue;
      entry.total += shares * payment.amount;
      if (payment.date > since) entry.lastYear += shares * payment.amount;
    }
    received.set(ticker, entry);
  }
  return received;
}

/** How much 1 put in on `from` became by the end of the daily series. The day itself does not count. */
export function dailyGrowth(series: Point[], from: string): number {
  return series
    .filter((point) => point.date > from)
    .reduce((total, point) => total * (1 + point.value / 100), 1);
}

/** Same with a monthly series: the month of `from` is partial, so it is left out. */
export function monthlyGrowth(series: Point[], from: string): number {
  const month = from.slice(0, 7);
  return series
    .filter((point) => point.date.slice(0, 7) > month)
    .reduce((total, point) => total * (1 + point.value / 100), 1);
}

/**
 * What the wallet would be worth if each purchase had gone into the index on the same day and each
 * sale had come out of it. Null when the sales took out more than the index had.
 */
export function sameMoneyIn(
  transactions: Transaction[],
  growth: (from: string) => number,
): number | null {
  const value = transactions.reduce(
    (total, transaction) =>
      total +
      (transaction.type === "buy" ? 1 : -1) *
        transaction.quantity *
        transaction.price *
        growth(transaction.date),
    0,
  );
  return value > 0 ? value : null;
}
