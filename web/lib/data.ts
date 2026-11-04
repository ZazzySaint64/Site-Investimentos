// Reads from Supabase with the publishable key. The site never calls the external data sources.

import type { Transaction } from "./portfolio.ts";

const PAGE_SIZE = 1000;
const TIMEOUT_MS = 8000;

export type Stats = {
  as_of: string;
  return_annual: number | null;
  volatility: number | null;
  sharpe: number | null;
  max_drawdown: number | null;
  corr_benchmark: number | null;
};

export type AssetRow = {
  ticker: string;
  name: string;
  class: string;
  sector: string | null;
  maturity: string | null;
  asset_stats: Stats | null;
  prices: { close: number; date: string }[];
};

export type JobRun = {
  id: number;
  job: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  details: {
    failed?: string[];
    rejected?: { ticker: string; date: string; reason: string }[];
    skipped?: string[];
    error?: string;
  };
};

export type MacroPoint = { series: string; date: string; value: number };
export type PricePoint = { date: string; close: number; adj_close: number };
const CACHED = { next: { revalidate: 60 } } as RequestInit;

export type DemoPersona = {
  slug: string;
  name: string;
  risk_profile: string;
  description: string;
};

async function get<T>(path: string, cacheOptions: RequestInit = CACHED): Promise<T> {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("SUPABASE_URL ou SUPABASE_PUBLISHABLE_KEY não configuradas");
  }
  const request = () =>
    fetch(`${SUPABASE_URL}/rest/v1${path}`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      ...cacheOptions,
    });
  const response = await request().catch(request);
  if (!response.ok) throw new Error(`Supabase respondeu HTTP ${response.status}`);
  return response.json();
}

async function getAllPages<T>(path: string): Promise<T[]> {
  const rows: T[] = [];
  while (true) {
    const page = await get<T[]>(`${path}&limit=${PAGE_SIZE}&offset=${rows.length}`);
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

const ASSET_COLUMNS =
  "ticker,name,class,sector,maturity," +
  "asset_stats(as_of,return_annual,volatility,sharpe,max_drawdown,corr_benchmark)," +
  "prices(close,date)";
const LATEST_PRICE = "prices.order=date.desc&prices.limit=1";

export function getAssets(): Promise<AssetRow[]> {
  return get(`/assets?select=${ASSET_COLUMNS}&active=eq.true&${LATEST_PRICE}&order=name`);
}

export async function getAsset(ticker: string): Promise<AssetRow | null> {
  const filter = `ticker=eq.${encodeURIComponent(ticker)}`;
  const rows = await get<AssetRow[]>(`/assets?select=${ASSET_COLUMNS}&${filter}&${LATEST_PRICE}`);
  return rows[0] ?? null;
}

export async function getPrices(ticker: string): Promise<PricePoint[]> {
  const filter = `assets.ticker=eq.${encodeURIComponent(ticker)}`;
  const rows = await getAllPages<PricePoint>(
    `/prices?select=date,close,adj_close,assets!inner(ticker)&${filter}&order=date`,
  );
  return rows.map(({ date, close, adj_close }) => ({ date, close, adj_close }));
}

export function getRuns(): Promise<JobRun[]> {
  return get("/job_runs?select=id,job,status,started_at,finished_at,details&order=id.desc&limit=5");
}

/** When the whole site was last updated. Runs that failed or covered few tickers do not count. */
export async function getLastGoodUpdate(): Promise<string | null> {
  const rows = await get<{ finished_at: string }[]>(
    "/job_runs?select=finished_at&job=eq.nightly&status=neq.failed&finished_at=not.is.null" +
      "&details->>tickers=is.null&order=id.desc&limit=1",
    { cache: "no-store" },
  );
  return rows[0]?.finished_at ?? null;
}

export function getDemoPersonas(): Promise<DemoPersona[]> {
  return get("/demo_personas?select=slug,name,risk_profile,description&order=id");
}

const DEMO_COLUMNS =
  "id,type,quantity,price,date,demo_personas!inner(slug)," +
  "asset:assets(ticker,name,class,sector,active,prices(close,date),splits(date,ratio))";

export function getDemoTransactions(slug: string): Promise<Transaction[]> {
  const filter = `demo_personas.slug=eq.${encodeURIComponent(slug)}`;
  const latestPrice = "asset.prices.order=date.desc&asset.prices.limit=1";
  return get(`/demo_transactions?select=${DEMO_COLUMNS}&${filter}&${latestPrice}&order=date,id`);
}

export function getCdiHistory(): Promise<MacroPoint[]> {
  return getAllPages(`/macro_series?select=series,date,value&series=eq.cdi&order=date`);
}

async function latestMacro(series: string, count: number): Promise<MacroPoint[]> {
  return get(
    `/macro_series?select=series,date,value&series=eq.${series}&order=date.desc&limit=${count}`,
  );
}

export async function getMacroSummary() {
  const [selic, cdi, ipca] = await Promise.all([
    latestMacro("selic", 1),
    latestMacro("cdi", 1),
    latestMacro("ipca", 12),
  ]);
  return { selic: selic[0], cdi: cdi[0], ipca };
}

export type HoldableAsset = { ticker: string; name: string; class: string };

export function getHoldableAssets(): Promise<HoldableAsset[]> {
  return get("/assets?select=ticker,name,class&holdable=eq.true&active=eq.true&order=name");
}
