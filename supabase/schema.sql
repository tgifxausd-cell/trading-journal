create extension if not exists pgcrypto;
create table if not exists public.trades (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 entry_at timestamptz not null default now(), exit_at timestamptz, market text not null, instrument text not null,
 segment text not null, option_type text, strike_price numeric, expiry_date date, direction text not null,
 quantity numeric not null default 1, lot_size numeric not null default 1, entry_price numeric not null, exit_price numeric,
 stop_loss numeric, target numeric, brokerage_charges numeric not null default 0, capital_deployed numeric not null default 0,
 gross_pnl numeric not null default 0, net_pnl numeric not null default 0, pnl_pct numeric not null default 0,
 r_multiple numeric, strategy_tags text[] not null default '{}', trade_thesis text not null default '', emotion text not null default 'Neutral',
 outcome text not null default 'Open', screenshot_url text, post_trade_review text not null default '', rules_followed text not null default 'Partial',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.trades enable row level security;
drop policy if exists "Users can view own trades" on public.trades;
drop policy if exists "Users can insert own trades" on public.trades;
drop policy if exists "Users can update own trades" on public.trades;
drop policy if exists "Users can delete own trades" on public.trades;
create policy "Users can view own trades" on public.trades for select using (auth.uid()=user_id);
create policy "Users can insert own trades" on public.trades for insert with check (auth.uid()=user_id);
create policy "Users can update own trades" on public.trades for update using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "Users can delete own trades" on public.trades for delete using (auth.uid()=user_id);
create index if not exists trades_user_entry_idx on public.trades(user_id,entry_at desc);
create index if not exists trades_user_instrument_idx on public.trades(user_id,instrument);
create index if not exists trades_user_outcome_idx on public.trades(user_id,outcome);
create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end; $$;
drop trigger if exists set_trades_updated_at on public.trades;
create trigger set_trades_updated_at before update on public.trades for each row execute function public.set_updated_at();
insert into storage.buckets(id,name,public) values('trade-screenshots','trade-screenshots',false) on conflict(id) do nothing;
create policy "Users can read own screenshots" on storage.objects for select to authenticated using (bucket_id='trade-screenshots' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Users can upload own screenshots" on storage.objects for insert to authenticated with check (bucket_id='trade-screenshots' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Users can delete own screenshots" on storage.objects for delete to authenticated using (bucket_id='trade-screenshots' and (storage.foldername(name))[1]=auth.uid()::text);
