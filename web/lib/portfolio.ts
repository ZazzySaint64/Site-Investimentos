// Portfolio figures from the transactions. The position is never saved, only calculated.

export type Transaction = {
  id: number;
  type: "buy" | "sell";
  quantity: number;
  price: number;
  date: string;
  asset: {
    ticker: string;
    name: string;
    class: string;
    sector: string | null;
    active: boolean;
    prices: { close: number; date: string }[]; // at most 1: the latest
    splits: { date: string; ratio: number }[];
  };
};

export type Position = {
  ticker: string;
  name: string;
  assetClass: string;
  sector: string | null;
  active: boolean;
  quantity: number;
  averageCost: number;
  cost: number;
  price: number | null;
  priceDate: string | null;
  value: number | null;
  result: number | null;
  share: number | null;
  maturity: string | null; // null for stock-exchange assets
};

export type Portfolio = {
  positions: Position[]; // largest value first, no price last
  invested: number; // cost of what is still held
  value: number; // only positions with a price
  result: number; // open result of positions with a price + realized on sales
  resultShare: number; // result / total bought; 0 if nothing was bought
  bought: number; // total bought of positions with a price, sold ones and extras
  realized: number;
  allocation: { assetClass: string; value: number; share: number }[]; // largest first
  missingPrices: string[];
};

const EMPTY_QUANTITY = 1e-6;

/** Shares of today per share on the transaction day, after the splits that came later. */
export function laterSplitFactor(transaction: Transaction): number {
  return transaction.asset.splits
    .filter((split) => split.date > transaction.date)
    .reduce((factor, split) => factor * split.ratio, 1);
}

export function hasLaterSplit(transaction: Transaction): boolean {
  return transaction.asset.splits.some((split) => split.date > transaction.date);
}

function chronological(a: Transaction, b: Transaction): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  if (a.type !== b.type) return a.type === "buy" ? -1 : 1;
  return a.id - b.id;
}

export function computePortfolio(transactions: Transaction[], extras: Position[] = []): Portfolio {
  const holdings = new Map<
    string,
    { asset: Transaction["asset"]; quantity: number; cost: number; bought: number }
  >();
  let realized = 0;

  for (const transaction of [...transactions].sort(chronological)) {
    const factor = laterSplitFactor(transaction);
    const quantity = transaction.quantity * factor;
    const price = transaction.price / factor;
    const holding = holdings.get(transaction.asset.ticker) ?? {
      asset: transaction.asset,
      quantity: 0,
      cost: 0,
      bought: 0,
    };
    if (transaction.type === "buy") {
      holding.quantity += quantity;
      holding.cost += quantity * price;
      holding.bought += quantity * price;
    } else {
      const averageCost = holding.quantity > 0 ? holding.cost / holding.quantity : 0;
      realized += (price - averageCost) * quantity;
      holding.quantity -= quantity;
      holding.cost -= averageCost * quantity;
    }
    holdings.set(transaction.asset.ticker, holding);
  }

  const held = [...holdings.values()].filter((holding) => holding.quantity > EMPTY_QUANTITY);
  // A position without a price has no result yet, so its cost stays out of the comparisons too.
  const bought =
    [...holdings.values()]
      .filter((holding) => holding.asset.prices[0] || holding.quantity <= EMPTY_QUANTITY)
      .reduce((total, holding) => total + holding.bought, 0) +
    extras.reduce((total, extra) => total + extra.cost, 0);
  const value =
    held.reduce(
      (total, { asset, quantity }) => total + (asset.prices[0] ? quantity * asset.prices[0].close : 0),
      0,
    ) + extras.reduce((total, extra) => total + (extra.value ?? 0), 0);

  const positions: Position[] = held
    .map(({ asset, quantity, cost }): Position => {
      const latest = asset.prices[0] ?? null;
      const positionValue = latest ? quantity * latest.close : null;
      return {
        ticker: asset.ticker,
        name: asset.name,
        assetClass: asset.class,
        sector: asset.sector,
        active: asset.active,
        quantity,
        averageCost: cost / quantity,
        cost,
        price: latest?.close ?? null,
        priceDate: latest?.date ?? null,
        value: positionValue,
        result: positionValue === null ? null : positionValue - cost,
        share: null as number | null, // set below, over the total with extras
        maturity: null as string | null,
      };
    })
    .concat(extras)
    .map((position) => ({
      ...position,
      share: position.value === null || value === 0 ? null : position.value / value,
    }))
    .sort((a, b) => (b.value ?? -1) - (a.value ?? -1));

  const byClass = new Map<string, number>();
  for (const position of positions) {
    if (position.value !== null) {
      byClass.set(position.assetClass, (byClass.get(position.assetClass) ?? 0) + position.value);
    }
  }

  const openResult = positions.reduce((total, position) => total + (position.result ?? 0), 0);
  const result = openResult + realized;
  return {
    positions,
    invested: positions
      .filter((position) => position.price !== null)
      .reduce((total, position) => total + position.cost, 0),
    value,
    result,
    resultShare: bought > 0 ? result / bought : 0,
    bought,
    realized,
    allocation: [...byClass.entries()]
      .map(([assetClass, classValue]) => ({
        assetClass,
        value: classValue,
        share: classValue / value,
      }))
      .sort((a, b) => b.value - a.value),
    missingPrices: positions.filter((position) => position.price === null).map((p) => p.ticker),
  };
}
