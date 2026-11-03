create table public.demo_personas (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  risk_profile text not null check (risk_profile in ('conservador', 'moderado', 'arrojado')),
  description text not null
);

create table public.demo_transactions (
  id bigint generated always as identity primary key,
  persona_id bigint not null references public.demo_personas (id),
  asset_id bigint not null references public.assets (id),
  type text not null check (type in ('buy', 'sell')),
  quantity numeric(18, 6) not null check (quantity > 0),
  price numeric(18, 6) not null check (price > 0),
  date date not null,
  unique (persona_id, asset_id, type, date)
);

alter table public.demo_personas enable row level security;
alter table public.demo_transactions enable row level security;

create policy "public read" on public.demo_personas for select to anon, authenticated using (true);
create policy "public read" on public.demo_transactions for select to anon, authenticated using (true);

revoke all on public.demo_personas, public.demo_transactions from anon, authenticated;

grant select on public.demo_personas, public.demo_transactions to anon, authenticated;

grant all on public.demo_personas, public.demo_transactions to service_role;

grant all on all sequences in schema public to service_role;
