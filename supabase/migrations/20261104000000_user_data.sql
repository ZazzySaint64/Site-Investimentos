create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  risk_profile text not null check (risk_profile in ('conservador', 'moderado', 'arrojado')),
  target_allocation jsonb not null check (jsonb_typeof(target_allocation) = 'object')
);

create table public.transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  asset_id bigint not null references public.assets (id),
  type text not null check (type in ('buy', 'sell')),
  quantity numeric(18, 6) not null check (quantity > 0),
  price numeric(18, 6) not null check (price > 0),
  date date not null
);

create index transactions_user_asset_date_idx on public.transactions (user_id, asset_id, date);

create table public.fixed_income (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  principal numeric(18, 2) not null,
  cdi_pct numeric(8, 4) not null,
  start_date date not null,
  maturity date,
  daily_liquidity boolean not null
);

create index fixed_income_user_idx on public.fixed_income (user_id);

alter table public.profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.fixed_income enable row level security;

create policy "own select" on public.profiles for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "own insert" on public.profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "own update" on public.profiles for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own select" on public.transactions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "own select" on public.fixed_income for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.profiles, public.transactions, public.fixed_income from anon, authenticated;

grant select, insert, update on public.profiles to authenticated;
grant select on public.transactions, public.fixed_income to authenticated;

grant all on public.profiles, public.transactions, public.fixed_income to service_role;

grant all on all sequences in schema public to service_role;

create schema private;
revoke all on schema private from public, anon, authenticated;

-- Raises when any point in the user's history leaves a negative position in the asset.
create function private.check_position(p_user uuid, p_asset bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_date date;
begin
  select date into v_date from (
    select t.date,
           sum((case t.type when 'buy' then 1 else -1 end) * t.quantity::float8 *
               coalesce((select exp(sum(ln(s.ratio))) from public.splits s
                         where s.asset_id = t.asset_id and s.date > t.date), 1))
             over (order by t.date, t.type, t.id) as running
    from public.transactions t
    where t.user_id = p_user and t.asset_id = p_asset
  ) moves
  where running < -1e-6
  order by date
  limit 1;

  if v_date is not null then
    raise exception 'Esta operação deixaria a posição negativa em %. Confira as datas e as quantidades.',
      to_char(v_date, 'DD/MM/YYYY') using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function private.check_position(uuid, bigint) from public, anon, authenticated;

create function public.add_transaction(
  p_ticker text, p_type text, p_quantity numeric, p_price numeric, p_date date
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_asset public.assets%rowtype;
  v_quantity numeric;
  v_price numeric;
  v_id bigint;
begin
  select * into v_asset from public.assets where ticker = upper(trim(p_ticker));
  if not found then
    raise exception 'Ativo não encontrado.' using errcode = 'P0001';
  end if;
  if not v_asset.holdable then
    raise exception 'Este ativo não pode entrar na carteira.' using errcode = 'P0001';
  end if;
  if p_type is null or p_type not in ('buy', 'sell') then
    raise exception 'Operação inválida.' using errcode = 'P0001';
  end if;

  v_quantity := round(p_quantity, 6);
  if v_quantity is null or v_quantity <= 0 or v_quantity > 1e11 then
    raise exception 'Informe uma quantidade maior que zero e menor que 100 bilhões.'
      using errcode = 'P0001';
  end if;
  v_price := round(p_price, 6);
  if v_price is null or v_price <= 0 or v_price > 1e11 then
    raise exception 'Informe um preço maior que zero e menor que 100 bilhões.'
      using errcode = 'P0001';
  end if;
  if p_date is null or p_date > (now() at time zone 'America/Sao_Paulo')::date then
    raise exception 'Informe uma data que não esteja no futuro.' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text || v_asset.id::text, 0));
  insert into public.transactions (user_id, asset_id, type, quantity, price, date)
  values (v_user, v_asset.id, p_type, v_quantity, v_price, p_date)
  returning id into v_id;
  perform private.check_position(v_user, v_asset.id);
  return v_id;
end;
$$;

create function public.delete_transaction(p_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_asset bigint;
begin
  select asset_id into v_asset from public.transactions where id = p_id and user_id = v_user;
  if not found then
    raise exception 'Lançamento não encontrado.' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text || v_asset::text, 0));
  delete from public.transactions where id = p_id and user_id = v_user;
  if not found then
    raise exception 'Lançamento não encontrado.' using errcode = 'P0001';
  end if;
  perform private.check_position(v_user, v_asset);
end;
$$;

create function public.add_fixed_income(
  p_name text, p_principal numeric, p_cdi_pct numeric, p_start_date date, p_maturity date,
  p_daily_liquidity boolean
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_name text := trim(p_name);
  v_principal numeric := round(p_principal, 2);
  v_cdi_pct numeric := round(p_cdi_pct, 4);
  v_first_cdi date;
  v_id bigint;
begin
  if v_name is null or v_name = '' or char_length(v_name) > 80 then
    raise exception 'Informe um nome de até 80 caracteres.' using errcode = 'P0001';
  end if;
  if v_principal is null or v_principal <= 0 or v_principal > 1e11 then
    raise exception 'Informe um valor maior que zero e menor que 100 bilhões.'
      using errcode = 'P0001';
  end if;
  if v_cdi_pct is null or v_cdi_pct <= 0 or v_cdi_pct > 1000 then
    raise exception 'Informe um percentual do CDI entre 0 e 1000.' using errcode = 'P0001';
  end if;
  if p_start_date is null or p_start_date > (now() at time zone 'America/Sao_Paulo')::date then
    raise exception 'Informe uma data de início que não esteja no futuro.' using errcode = 'P0001';
  end if;
  select min(date) into v_first_cdi from public.macro_series where series = 'cdi';
  if v_first_cdi is not null and p_start_date < v_first_cdi then
    raise exception 'Só há CDI a partir de %.', to_char(v_first_cdi, 'DD/MM/YYYY')
      using errcode = 'P0001';
  end if;
  if p_maturity is not null and p_maturity <= p_start_date then
    raise exception 'O vencimento precisa ser depois do início.' using errcode = 'P0001';
  end if;

  insert into public.fixed_income (user_id, name, principal, cdi_pct, start_date, maturity,
                                   daily_liquidity)
  values (v_user, v_name, v_principal, v_cdi_pct, p_start_date, p_maturity,
          coalesce(p_daily_liquidity, false))
  returning id into v_id;
  return v_id;
end;
$$;

create function public.delete_fixed_income(p_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.fixed_income where id = p_id and user_id = auth.uid();
  if not found then
    raise exception 'Lançamento não encontrado.' using errcode = 'P0001';
  end if;
end;
$$;

create function public.delete_my_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke execute on function
  public.add_transaction(text, text, numeric, numeric, date),
  public.delete_transaction(bigint),
  public.add_fixed_income(text, numeric, numeric, date, date, boolean),
  public.delete_fixed_income(bigint),
  public.delete_my_account()
  from public, anon;

grant execute on function
  public.add_transaction(text, text, numeric, numeric, date),
  public.delete_transaction(bigint),
  public.add_fixed_income(text, numeric, numeric, date, date, boolean),
  public.delete_fixed_income(bigint),
  public.delete_my_account()
  to authenticated;
