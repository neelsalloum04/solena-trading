-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  plan text not null default 'starter' check (plan in ('starter', 'pro', 'elite')),
  plan_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Chat sessions
create table public.chat_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null default 'New Analysis',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.chat_sessions enable row level security;
create policy "Users can manage own chat sessions" on public.chat_sessions
  for all using (auth.uid() = user_id);

-- Chat messages
create table public.chat_messages (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.chat_sessions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  image_url text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.chat_messages enable row level security;
create policy "Users can manage own messages" on public.chat_messages
  for all using (auth.uid() = user_id);

-- Trading signals
create table public.trading_signals (
  id uuid default uuid_generate_v4() primary key,
  asset text not null,
  pair text not null,
  type text not null check (type in ('BUY', 'SELL')),
  market text not null check (market in ('forex', 'crypto', 'indices', 'stocks', 'commodities', 'futures', 'options')),
  entry_price numeric not null,
  stop_loss numeric not null,
  take_profit_1 numeric not null,
  take_profit_2 numeric,
  take_profit_3 numeric,
  risk_reward text,
  confidence integer not null check (confidence between 0 and 100),
  potential_gain text,
  potential_loss text,
  estimated_duration text,
  justification text,
  status text not null default 'active' check (status in ('active', 'closed_profit', 'closed_loss', 'pending')),
  pnl numeric,
  created_at timestamptz default now(),
  closed_at timestamptz
);

-- Signals are public to read for authenticated users
alter table public.trading_signals enable row level security;
create policy "Authenticated users can read signals" on public.trading_signals
  for select to authenticated using (true);

-- Bot configurations
create table public.bot_configs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  broker text not null check (broker in ('binance', 'alpaca', 'bybit', 'kraken', 'mt4', 'mt5', 'ib')),
  api_key_encrypted text not null,
  api_secret_encrypted text not null,
  is_active boolean default false,
  risk_per_trade numeric default 2,
  max_drawdown numeric default 15,
  max_positions integer default 3,
  markets text[] default array['crypto'],
  strategy text default 'ai_hybrid' check (strategy in ('ai_hybrid', 'trend_following', 'mean_reversion', 'scalping')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.bot_configs enable row level security;
create policy "Users can manage own bot configs" on public.bot_configs
  for all using (auth.uid() = user_id);

-- Trades
create table public.trades (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  bot_config_id uuid references public.bot_configs(id) on delete set null,
  signal_id uuid references public.trading_signals(id) on delete set null,
  asset text not null,
  pair text not null,
  type text not null check (type in ('BUY', 'SELL')),
  entry_price numeric not null,
  exit_price numeric,
  quantity numeric not null,
  pnl numeric,
  pnl_percent numeric,
  status text not null default 'open' check (status in ('open', 'closed')),
  opened_at timestamptz default now(),
  closed_at timestamptz
);

alter table public.trades enable row level security;
create policy "Users can manage own trades" on public.trades
  for all using (auth.uid() = user_id);

-- Subscriptions
create table public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null default 'starter' check (plan in ('starter', 'pro', 'elite')),
  status text not null default 'trialing' check (status in ('active', 'canceled', 'past_due', 'trialing')),
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscriptions enable row level security;
create policy "Users can view own subscription" on public.subscriptions
  for select using (auth.uid() = user_id);

-- Updated at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_bot_configs_updated_at
  before update on public.bot_configs
  for each row execute procedure public.handle_updated_at();

create trigger handle_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.handle_updated_at();

-- Seed some initial signals
insert into public.trading_signals (asset, pair, type, market, entry_price, stop_loss, take_profit_1, take_profit_2, take_profit_3, risk_reward, confidence, potential_gain, potential_loss, estimated_duration, justification) values
  ('BTC', 'BTC/USDT', 'BUY', 'crypto', 67200, 65400, 69000, 71000, 74000, '1:2.5', 87, '+2.7%', '-0.9%', '4-8h', 'Strong bullish momentum on H4 with RSI divergence and volume spike at key support'),
  ('EUR', 'EUR/USD', 'SELL', 'forex', 1.0852, 1.0890, 1.0820, 1.0790, 1.0750, '1:2.0', 74, '+0.3%', '-0.4%', '2-4h', 'Bearish engulfing on M30 at daily resistance with declining momentum'),
  ('XAU', 'XAU/USD', 'BUY', 'commodities', 2648, 2628, 2668, 2688, 2710, '1:3.0', 81, '+0.8%', '-0.9%', '1-2 days', 'Safe-haven demand increasing ahead of Fed decision, gold holding above key $2640 support');
