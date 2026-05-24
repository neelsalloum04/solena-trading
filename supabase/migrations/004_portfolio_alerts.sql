-- Portfolio entries: manual crypto holdings tracker
create table if not exists public.portfolio_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  coin_id text not null,
  coin_symbol text not null,
  coin_name text not null,
  coin_image text default '',
  quantity numeric not null check (quantity > 0),
  avg_buy_price numeric not null check (avg_buy_price > 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.portfolio_entries enable row level security;

create policy "Users can manage own portfolio entries"
  on public.portfolio_entries for all using (auth.uid() = user_id);

create trigger handle_portfolio_entries_updated_at
  before update on public.portfolio_entries
  for each row execute procedure public.handle_updated_at();

-- Price alerts
create table if not exists public.price_alerts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  coin_id text not null,
  coin_symbol text not null,
  coin_name text not null,
  target_price numeric not null check (target_price > 0),
  direction text not null check (direction in ('above', 'below')),
  active boolean default true,
  triggered_at timestamptz,
  created_at timestamptz default now()
);

alter table public.price_alerts enable row level security;

create policy "Users can manage own price alerts"
  on public.price_alerts for all using (auth.uid() = user_id);
