-- =====================================================
-- FX Journal — Supabase SQL Schema
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── PROFILES ────────────────────────────────────────
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── TRADES ──────────────────────────────────────────
create table trades (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  symbol text not null,
  side text not null check (side in ('BUY', 'SELL')),
  lots numeric(10,2) not null default 0.1,
  entry_price numeric(12,5),
  exit_price numeric(12,5),
  entry_time timestamptz,
  exit_time timestamptz,
  pips numeric(10,2) default 0,
  pnl numeric(12,2) default 0,
  r_multiple numeric(8,3),
  stop_loss numeric(12,5),
  take_profit numeric(12,5),
  risk_percent numeric(5,2),
  session text check (session in ('London', 'New York', 'Asian', 'London/NY Overlap')),
  setup_tag text,
  emotion_tag text,
  notes text,
  post_analysis text,
  image_url text,
  plan_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table trades enable row level security;
create policy "Users can CRUD own trades" on trades for all using (auth.uid() = user_id);

-- Index for fast analytics queries
create index trades_user_id_idx on trades(user_id);
create index trades_exit_time_idx on trades(exit_time);
create index trades_symbol_idx on trades(symbol);
create index trades_session_idx on trades(session);

-- ─── TRADING PLANS ───────────────────────────────────
create table trading_plans (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table trading_plans enable row level security;
create policy "Users can CRUD own plans" on trading_plans for all using (auth.uid() = user_id);

-- ─── PLAN RULES ──────────────────────────────────────
create table plan_rules (
  id uuid default uuid_generate_v4() primary key,
  plan_id uuid references trading_plans on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  rule_text text not null,
  sort_order int default 0
);

alter table plan_rules enable row level security;
create policy "Users can CRUD own plan rules" on plan_rules for all using (auth.uid() = user_id);

-- ─── TRADE RULE COMPLIANCE ───────────────────────────
create table trade_rule_compliance (
  id uuid default uuid_generate_v4() primary key,
  trade_id uuid references trades on delete cascade not null,
  rule_id uuid references plan_rules on delete cascade not null,
  followed boolean not null
);

alter table trade_rule_compliance enable row level security;
create policy "Users can manage compliance" on trade_rule_compliance
  for all using (
    auth.uid() = (select user_id from trades where id = trade_id)
  );

-- ─── SETUPS LIBRARY ──────────────────────────────────
create table setups (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  tag text,
  description text,
  color text default '#00d4a0',
  rating int default 3 check (rating between 1 and 5),
  created_at timestamptz default now()
);

alter table setups enable row level security;
create policy "Users can CRUD own setups" on setups for all using (auth.uid() = user_id);

-- ─── MISTAKES ────────────────────────────────────────
create table mistakes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  category text,
  description text,
  color text default '#e64040',
  occurrence_count int default 0,
  created_at timestamptz default now()
);

alter table mistakes enable row level security;
create policy "Users can CRUD own mistakes" on mistakes for all using (auth.uid() = user_id);

-- ─── WEEKLY REVIEWS ──────────────────────────────────
create table weekly_reviews (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  week_start date not null,
  notes text,
  sleep_quality int check (sleep_quality between 1 and 5),
  stress_level int check (stress_level between 1 and 5),
  created_at timestamptz default now(),
  unique(user_id, week_start)
);

alter table weekly_reviews enable row level security;
create policy "Users can CRUD own reviews" on weekly_reviews for all using (auth.uid() = user_id);

-- ─── TRADING PLAN NOTES ──────────────────────────────
create table plan_notes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  content text default '',
  updated_at timestamptz default now(),
  unique(user_id)
);

alter table plan_notes enable row level security;
create policy "Users can CRUD own plan notes" on plan_notes for all using (auth.uid() = user_id);

-- ─── USEFUL VIEWS ────────────────────────────────────

-- Trade stats per user
create or replace view trade_stats as
select
  user_id,
  count(*) as total_trades,
  count(*) filter (where pnl > 0) as wins,
  count(*) filter (where pnl <= 0) as losses,
  round(count(*) filter (where pnl > 0)::numeric / nullif(count(*), 0) * 100, 2) as win_rate,
  round(sum(pnl)::numeric, 2) as net_pnl,
  round(sum(pips)::numeric, 1) as net_pips,
  round(avg(pnl) filter (where pnl > 0)::numeric, 2) as avg_win,
  round(abs(avg(pnl) filter (where pnl <= 0))::numeric, 2) as avg_loss,
  round(
    sum(pnl) filter (where pnl > 0)::numeric /
    nullif(abs(sum(pnl) filter (where pnl <= 0)), 0), 2
  ) as profit_factor
from trades
group by user_id;

-- Seed default setups for new users (call this from backend after signup)
-- Or insert via the app on first login
