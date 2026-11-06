// Gathers what the wallet pages show about dividends and the CDI and IPCA comparison.

import { getCdiHistory, getDividendsByTicker, getIpcaHistory } from "./data.ts";
import type { Portfolio, Transaction } from "./portfolio.ts";
import {
  dailyGrowth,
  dividendsReceived,
  monthlyGrowth,
  sameMoneyIn,
  type Received,
} from "./returns.ts";

export type Income = {
  received: Map<string, Received>; // tickers with no payment saved are missing
  total: number;
  lastYear: number;
  since: string; // first purchase in the comparison
  wallet: number; // value today of what came from the stock exchange, plus the dividends
  cdi: number | null;
  ipca: number | null;
  cdiUntil: string | null;
  ipcaUntil: string | null;
};

const PAYING = new Set(["acao_br", "fii"]);

/** Null when there is nothing to compare or the data could not be read. */
export async function getIncome(
  transactions: Transaction[],
  portfolio: Portfolio,
  today: string,
): Promise<Income | null> {
  // Without a price there is no value today, so those assets stay out of the comparison.
  const used = transactions.filter(
    (transaction) => !portfolio.missingPrices.includes(transaction.asset.ticker),
  );
  if (!used.length) return null;
  const tickers = [
    ...new Set(used.filter((t) => PAYING.has(t.asset.class)).map((t) => t.asset.ticker)),
  ];
  try {
    const [payments, cdi, ipca] = await Promise.all([
      getDividendsByTicker(tickers),
      getCdiHistory(),
      getIpcaHistory(),
    ]);
    const received = dividendsReceived(used, payments, today);
    const total = [...received.values()].reduce((sum, item) => sum + item.total, 0);
    const lastYear = [...received.values()].reduce((sum, item) => sum + item.lastYear, 0);
    const stockValue = portfolio.positions
      .filter((position) => position.assetClass !== "renda_fixa")
      .reduce((sum, position) => sum + (position.value ?? 0), 0);
    return {
      received,
      total,
      lastYear,
      since: used.reduce((first, t) => (t.date < first ? t.date : first), used[0].date),
      wallet: stockValue + total,
      cdi: cdi.length ? sameMoneyIn(used, (date) => dailyGrowth(cdi, date)) : null,
      ipca: ipca.length ? sameMoneyIn(used, (date) => monthlyGrowth(ipca, date)) : null,
      cdiUntil: cdi.at(-1)?.date ?? null,
      ipcaUntil: ipca.at(-1)?.date ?? null,
    };
  } catch {
    return null;
  }
}
