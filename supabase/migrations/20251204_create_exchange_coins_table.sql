-- Ensure exchange_coins table exists with indexes and permissive policies
create table if not exists public.exchange_coins (
  id uuid primary key default gen_random_uuid(),
  token_address text not null unique,
  name text not null,
  symbol text not null,
  image_url text,
  price_usd numeric(20,10),
  market_cap numeric(20,2),
  price_change_24h numeric(10,2),
  liquidity_usd numeric(20,2),
  likes integer default 0,
  listed_by uuid references public.users(id),
  listed_by_username text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_exchange_coins_created_at on public.exchange_coins(created_at desc);
create index if not exists idx_exchange_coins_likes on public.exchange_coins(likes desc);
create index if not exists idx_exchange_coins_market_cap on public.exchange_coins(market_cap desc);

alter table public.exchange_coins enable row level security;

drop policy if exists "read_exchange_coins" on public.exchange_coins;
drop policy if exists "insert_exchange_coins" on public.exchange_coins;
drop policy if exists "update_exchange_coins" on public.exchange_coins;

create policy "read_exchange_coins" on public.exchange_coins
  for select using (true);

create policy "insert_exchange_coins" on public.exchange_coins
  for insert with check (auth.role() = 'authenticated');

create policy "update_exchange_coins" on public.exchange_coins
  for update using (auth.role() = 'authenticated') with check (true);

create or replace function public.increment_coin_likes(coin_id uuid)
returns void as $$
begin
  update public.exchange_coins
    set likes = likes + 1,
        updated_at = now()
  where id = coin_id;
end;
$$ language plpgsql;

alter publication supabase_realtime add table public.exchange_coins;
