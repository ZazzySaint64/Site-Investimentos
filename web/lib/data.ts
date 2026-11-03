// Reads from Supabase with the publishable key. The site never calls the external data sources.

const PAGE_SIZE = 1000;

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

async function get<T>(path: string): Promise<T> {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("SUPABASE_URL ou SUPABASE_PUBLISHABLE_KEY não configuradas");
  }
  const request = () =>
    fetch(`${SUPABASE_URL}/rest/v1${path}`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
      next: { revalidate: 60 },
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
