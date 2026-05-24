-- BTC Scalping Bot — persisted signals and trade history

create table if not exists btc_signals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  signal       text not null check (signal in ('LONG', 'SHORT', 'WAIT')),
  confidence   integer not null,
  entry_price  numeric not null,
  stop_loss    numeric not null,
  tp1          numeric not null,
  tp2          numeric not null,
  tp3          numeric not null,
  risk_reward  numeric not null,
  probability  integer not null,
  scores       jsonb not null default '{}',
  reasoning    text,
  timeframe    text,
  market_bias  text,
  generated_at timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

create table if not exists btc_trades (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  side         text not null check (side in ('LONG', 'SHORT')),
  entry_price  numeric not null,
  close_price  numeric not null,
  quantity     numeric not null,
  usdt_size    numeric not null,
  pnl          numeric not null,
  pnl_pct      numeric not null,
  close_reason text not null,
  mode         text not null check (mode in ('paper', 'live')),
  from_signal  boolean default false,
  closed_at    timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

alter table btc_signals enable row level security;
alter table btc_trades  enable row level security;

create policy "own signals" on btc_signals for all using (auth.uid() = user_id);
create policy "own trades"  on btc_trades  for all using (auth.uid() = user_id);

create index if not exists btc_signals_user_idx on btc_signals(user_id, generated_at desc);
create index if not exists btc_trades_user_idx  on btc_trades(user_id, closed_at desc);
