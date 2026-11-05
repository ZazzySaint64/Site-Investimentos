-- Cash paid per share (Yahoo) and the reports FIIs send to CVM. Fractions as CVM publishes them.

create table public.dividends (
  asset_id bigint not null references public.assets (id),
  date date not null,
  amount numeric(18, 8) not null check (amount > 0),
  primary key (asset_id, date)
);

create table public.fii_monthly (
  asset_id bigint not null references public.assets (id),
  month date not null,
  book_value double precision,
  holders integer,
  admin_fee double precision,
  amortization double precision,
  share_buildings double precision,
  share_development double precision,
  share_paper double precision,
  share_funds double precision,
  share_other double precision,
  primary key (asset_id, month)
);

create table public.fii_quarterly (
  asset_id bigint primary key references public.assets (id),
  quarter date not null,
  buildings integer not null,
  vacancy double precision,
  vacancy_doubtful boolean not null default false,
  default_rate double precision,
  lease_12m double precision,
  lease_24m double precision,
  lease_36m double precision,
  lease_over_36m double precision,
  lease_undetermined double precision,
  tenant_sectors jsonb not null default '[]'
);

alter table public.dividends enable row level security;
alter table public.fii_monthly enable row level security;
alter table public.fii_quarterly enable row level security;

create policy "public read" on public.dividends for select to anon, authenticated using (true);
create policy "public read" on public.fii_monthly for select to anon, authenticated using (true);
create policy "public read" on public.fii_quarterly for select to anon, authenticated using (true);

revoke all on public.dividends, public.fii_monthly, public.fii_quarterly from anon, authenticated;
grant select on public.dividends, public.fii_monthly, public.fii_quarterly to anon, authenticated;
grant all on public.dividends, public.fii_monthly, public.fii_quarterly to service_role;
