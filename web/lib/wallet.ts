import { GENERIC_SAVE_ERROR, toActionResult, type ActionResult } from "./action-result";
import { getCdiHistory } from "./data";
import { fixedIncomePositions, type FixedIncome } from "./fixed-income";
import { todayInBrazil } from "./phrases";
import { computePortfolio, type Portfolio, type Position, type Transaction } from "./portfolio";
import { isRiskProfile, isValidTarget, type RiskProfile, type TargetAllocation } from "./profile";
import { createClient, getCurrentUser, requireUser } from "./supabase/server";

export type Profile = { risk_profile: RiskProfile; target_allocation: TargetAllocation };

export async function getProfile(): Promise<Profile | null> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("risk_profile, target_allocation")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error("Could not read the profile.");
  if (!data || !isRiskProfile(data.risk_profile) || !isValidTarget(data.target_allocation)) return null;
  return { risk_profile: data.risk_profile, target_allocation: data.target_allocation };
}

export async function saveProfile(profile: Profile): Promise<ActionResult> {
  const user = await requireUser();
  if (!isRiskProfile(profile.risk_profile) || !isValidTarget(profile.target_allocation)) {
    return { ok: false, message: "A meta precisa somar 100%, com números inteiros." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").upsert({
    user_id: user.id,
    risk_profile: profile.risk_profile,
    target_allocation: profile.target_allocation,
  });
  return toActionResult(error);
}

export type TransactionInput = {
  ticker: string;
  type: "buy" | "sell";
  quantity: number;
  price: number;
  date: string | null;
};

export type FixedIncomeInput = {
  name: string;
  principal: number;
  cdi_pct: number;
  start_date: string | null;
  maturity: string | null;
  daily_liquidity: boolean;
};

const TRANSACTION_COLUMNS =
  "id,type,quantity,price,date," +
  "asset:assets!inner(ticker,name,class,sector,active,prices(close,date),splits(date,ratio))";

const PAGE = 1000;

// Supabase cuts a response at its row cap, so read in pages until one comes back short.
async function readAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  failure: string,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error || !data) throw new Error(failure);
    rows.push(...data);
    if (data.length < PAGE) return rows;
  }
}

// Same columns as the demo. RLS keeps only the rows of the session user.
async function readTransactions(ticker?: string): Promise<Transaction[]> {
  const supabase = await createClient();
  const data = await readAll<Transaction>((from, to) => {
    let query = supabase
      .from("transactions")
      .select(TRANSACTION_COLUMNS)
      .order("date")
      .order("id")
      .order("date", { referencedTable: "asset.prices", ascending: false })
      .limit(1, { referencedTable: "asset.prices" });
    if (ticker) query = query.eq("asset.ticker", ticker);
    return query.range(from, to) as unknown as PromiseLike<{ data: Transaction[] | null; error: unknown }>;
  }, "Could not read the transactions.");
  // numeric columns may arrive as strings
  return data.map((row) => ({
    ...row,
    quantity: Number(row.quantity),
    price: Number(row.price),
    asset: {
      ...row.asset,
      prices: row.asset.prices.map((p) => ({ ...p, close: Number(p.close) })),
      splits: row.asset.splits.map((s) => ({ ...s, ratio: Number(s.ratio) })),
    },
  }));
}

export async function getTransactions(): Promise<Transaction[]> {
  await requireUser();
  return readTransactions();
}

export async function getFixedIncome(): Promise<FixedIncome[]> {
  await requireUser();
  const supabase = await createClient();
  const data = await readAll(
    (from, to) =>
      supabase
        .from("fixed_income")
        .select("id,name,principal,cdi_pct,start_date,maturity,daily_liquidity")
        .order("start_date")
        .order("id")
        .range(from, to),
    "Could not read the fixed income.",
  );
  return data.map((row) => ({
    ...row,
    principal: Number(row.principal),
    cdi_pct: Number(row.cdi_pct),
  }));
}

export async function getWallet(): Promise<{
  portfolio: Portfolio;
  transactions: Transaction[];
  fixedIncome: FixedIncome[];
  profile: Profile | null;
}> {
  const [transactions, fixedIncome, profile] = await Promise.all([
    getTransactions(),
    getFixedIncome(),
    getProfile(),
  ]);
  // The CDI is only needed when there is fixed income to value.
  const cdi = fixedIncome.length ? await getCdiHistory() : [];
  const extras = fixedIncomePositions(fixedIncome, cdi, todayInBrazil());
  return { portfolio: computePortfolio(transactions, extras), transactions, fixedIncome, profile };
}

// Runs on a public page: any failure means "no position", never an error.
export async function getMyPosition(ticker: string): Promise<Position | null> {
  try {
    if (!(await getCurrentUser())) return null;
    const portfolio = computePortfolio(await readTransactions(ticker));
    return portfolio.positions.find((position) => position.ticker === ticker) ?? null;
  } catch {
    return null;
  }
}

type Database = Awaited<ReturnType<typeof createClient>>;
type RpcOutcome = PromiseLike<{ error: { code?: string; message: string } | null }>;

async function write(call: (db: Database) => RpcOutcome): Promise<ActionResult> {
  await requireUser();
  try {
    const { error } = await call(await createClient());
    return toActionResult(error);
  } catch {
    return { ok: false, message: GENERIC_SAVE_ERROR };
  }
}

export const addTransaction = (input: TransactionInput) =>
  write((db) =>
    db.rpc("add_transaction", {
      p_ticker: input.ticker,
      p_type: input.type,
      p_quantity: input.quantity,
      p_price: input.price,
      p_date: input.date,
    }),
  );

export const deleteTransaction = (id: number) =>
  write((db) => db.rpc("delete_transaction", { p_id: id }));

export const addFixedIncome = (input: FixedIncomeInput) =>
  write((db) =>
    db.rpc("add_fixed_income", {
      p_name: input.name,
      p_principal: input.principal,
      p_cdi_pct: input.cdi_pct,
      p_start_date: input.start_date,
      p_maturity: input.maturity,
      p_daily_liquidity: input.daily_liquidity,
    }),
  );

export const deleteFixedIncome = (id: number) =>
  write((db) => db.rpc("delete_fixed_income", { p_id: id }));
