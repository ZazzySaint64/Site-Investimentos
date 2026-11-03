create table public.assets (
  id bigint generated always as identity primary key,
  ticker text not null unique,
  name text not null,
  class text not null check (class in ('acao_br', 'fii', 'acao_eua', 'cripto', 'tesouro', 'indice')),
  currency text not null check (currency in ('BRL', 'USD')),
  sector text,
  maturity date,
  holdable boolean not null,
  ml_enabled boolean not null,
  active boolean not null
);

create table public.prices (
  asset_id bigint not null references public.assets (id),
  date date not null,
  close numeric(18, 6) not null check (close > 0),
  adj_close numeric(18, 6) not null check (adj_close > 0),
  primary key (asset_id, date)
);

create table public.splits (
  asset_id bigint not null references public.assets (id),
  date date not null,
  ratio double precision not null check (ratio > 0),
  primary key (asset_id, date)
);

create table public.macro_series (
  series text not null,
  date date not null,
  value double precision not null,
  primary key (series, date)
);

create table public.monthly_returns (
  asset_id bigint not null references public.assets (id),
  month date not null,
  ret_local double precision not null,
  ret_brl double precision not null,
  primary key (asset_id, month)
);

create table public.asset_stats (
  asset_id bigint primary key references public.assets (id),
  as_of date not null,
  return_annual double precision,
  volatility double precision,
  sharpe double precision,
  max_drawdown double precision,
  corr_benchmark double precision
);

create table public.sector_stats (
  sector text primary key,
  as_of date not null,
  worst_month_ret double precision,
  worst_month date,
  volatility double precision
);

create table public.job_runs (
  id bigint generated always as identity primary key,
  job text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null check (status in ('running', 'success', 'partial', 'failed')),
  details jsonb not null default '{}'
);

alter table public.assets enable row level security;
alter table public.prices enable row level security;
alter table public.splits enable row level security;
alter table public.macro_series enable row level security;
alter table public.monthly_returns enable row level security;
alter table public.asset_stats enable row level security;
alter table public.sector_stats enable row level security;
alter table public.job_runs enable row level security;

create policy "public read" on public.assets for select to anon, authenticated using (true);
create policy "public read" on public.prices for select to anon, authenticated using (true);
create policy "public read" on public.splits for select to anon, authenticated using (true);
create policy "public read" on public.macro_series for select to anon, authenticated using (true);
create policy "public read" on public.monthly_returns for select to anon, authenticated using (true);
create policy "public read" on public.asset_stats for select to anon, authenticated using (true);
create policy "public read" on public.sector_stats for select to anon, authenticated using (true);
create policy "public read" on public.job_runs for select to anon, authenticated using (true);

revoke all on public.assets, public.prices, public.splits, public.macro_series,
  public.monthly_returns, public.asset_stats, public.sector_stats, public.job_runs
  from anon, authenticated;

grant select on public.assets, public.prices, public.splits, public.macro_series,
  public.monthly_returns, public.asset_stats, public.sector_stats, public.job_runs
  to anon, authenticated;

grant all on public.assets, public.prices, public.splits, public.macro_series,
  public.monthly_returns, public.asset_stats, public.sector_stats, public.job_runs
  to service_role;

grant all on all sequences in schema public to service_role;
