-- ArcadiaX initial schema (phase 1)

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  whop_company_id text unique not null,
  plan_tier text not null default 'free',
  created_at timestamptz not null default now()
);

-- Stored procedure to deduct credits and write ledger for spend + rake
create or replace function public.arcx_spend_and_ledger(
  p_member_id uuid,
  p_spend_amount integer,
  p_session_id uuid,
  p_rake_amount integer default 0
) returns void as $$
declare
  v_balance integer;
begin
  -- lock member row and check balance
  update public.members set balance_credits = balance_credits - p_spend_amount
  where id = p_member_id and balance_credits >= p_spend_amount;
  if not found then
    raise exception 'INSUFFICIENT_CREDITS';
  end if;

  -- ledger spend
  insert into public.credit_ledger(member_id, type, amount, reference_type, reference_id, notes)
  values (p_member_id, 'spend', -p_spend_amount, 'session', p_session_id, 'entry spend');

  -- rake ledger
  if p_rake_amount > 0 then
    insert into public.credit_ledger(member_id, type, amount, reference_type, reference_id, notes)
    values (p_member_id, 'rake', -p_rake_amount, 'session', p_session_id, 'platform rake');
  end if;
end;
$$ language plpgsql security definer;

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  whop_user_id text not null,
  account_id uuid not null references public.accounts(id) on delete cascade,
  role text not null default 'member',
  xp integer not null default 0,
  balance_credits integer not null default 0,
  created_at timestamptz not null default now(),
  unique (whop_user_id, account_id)
);

create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  type text not null check (type in ('purchase','spend','award','refund','rake')),
  amount integer not null,
  reference_type text,
  reference_id uuid,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  type text not null check (type in ('trivia','raffle','spin','prediction')),
  name text not null,
  status text not null default 'draft',
  config jsonb not null default '{}',
  branding jsonb not null default '{}',
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  schedule_at timestamptz,
  status text not null default 'lobby',
  entry_cost integer not null default 0,
  prize_type text not null default 'credits',
  prize_config jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.game_rounds (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  index integer not null,
  state text not null default 'waiting',
  payload jsonb not null default '{}',
  answer jsonb,
  started_at timestamptz,
  ended_at timestamptz
);

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  paid_credits integer not null default 0,
  created_at timestamptz not null default now(),
  unique (session_id, member_id)
);

create table if not exists public.actions (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.game_rounds(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  payload jsonb not null,
  score integer,
  result text,
  created_at timestamptz not null default now()
);

-- Enforce one action per member per round
create unique index if not exists actions_unique_round_member on public.actions(round_id, member_id);

-- Require entry before action: trigger
create or replace function public.arcx_require_entry() returns trigger as $$
declare
  v_session uuid;
  v_count integer;
begin
  select session_id into v_session from public.game_rounds where id = NEW.round_id;
  select count(*) into v_count from public.entries where session_id = v_session and member_id = NEW.member_id;
  if coalesce(v_count,0) = 0 then
    raise exception 'NOT_ENTERED';
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_actions_require_entry on public.actions;
create trigger trg_actions_require_entry before insert on public.actions for each row execute function public.arcx_require_entry();

create table if not exists public.iap_purchases (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  whop_txn_id text not null unique,
  bundle_id text not null,
  amount_usd numeric(10,2) not null,
  credits_awarded integer not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- RLS policies
alter table public.accounts enable row level security;
alter table public.members enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.games enable row level security;
alter table public.game_sessions enable row level security;
alter table public.game_rounds enable row level security;
alter table public.entries enable row level security;
alter table public.actions enable row level security;
alter table public.iap_purchases enable row level security;

-- For demo/dev, open read on public; tighten in prod with JWT claims
drop policy if exists "read_all_public" on public.accounts;
drop policy if exists "read_all_public" on public.members;
drop policy if exists "read_all_public" on public.games;
drop policy if exists "read_all_public" on public.game_sessions;
drop policy if exists "read_all_public" on public.game_rounds;
drop policy if exists "read_all_public" on public.entries;
drop policy if exists "read_all_public" on public.actions;
drop policy if exists "read_all_public" on public.credit_ledger;
drop policy if exists "read_all_public" on public.iap_purchases;

create policy "read_all_public" on public.accounts for select using (true);
create policy "read_all_public" on public.members for select using (true);
create policy "read_all_public" on public.games for select using (true);
create policy "read_all_public" on public.game_sessions for select using (true);
create policy "read_all_public" on public.game_rounds for select using (true);
create policy "read_all_public" on public.entries for select using (true);
create policy "read_all_public" on public.actions for select using (true);
create policy "read_all_public" on public.credit_ledger for select using (true);
create policy "read_all_public" on public.iap_purchases for select using (true);

-- Restrict writes to future JWT claims (placeholder; wire to Whop auth later)
drop policy if exists "deny_writes" on public.accounts;
drop policy if exists "deny_writes" on public.members;
drop policy if exists "deny_writes" on public.credit_ledger;
drop policy if exists "deny_writes" on public.games;
drop policy if exists "deny_writes" on public.game_sessions;
drop policy if exists "deny_writes" on public.game_rounds;
drop policy if exists "deny_writes" on public.entries;
drop policy if exists "deny_writes" on public.actions;
drop policy if exists "deny_writes" on public.iap_purchases;

create policy "deny_writes" on public.accounts for all to public using (false) with check (false);
create policy "deny_writes" on public.members for all to public using (false) with check (false);
create policy "deny_writes" on public.credit_ledger for all to public using (false) with check (false);
create policy "deny_writes" on public.games for all to public using (false) with check (false);
create policy "deny_writes" on public.game_sessions for all to public using (false) with check (false);
create policy "deny_writes" on public.game_rounds for all to public using (false) with check (false);
create policy "deny_writes" on public.entries for all to public using (false) with check (false);
create policy "deny_writes" on public.actions for all to public using (false) with check (false);
create policy "deny_writes" on public.iap_purchases for all to public using (false) with check (false);

-- Allow writes from service role only (keep public denied)
create policy if not exists "service_writes_games" on public.games for all to service_role using (true) with check (true);
create policy if not exists "service_writes_sessions" on public.game_sessions for all to service_role using (true) with check (true);
create policy if not exists "service_writes_rounds" on public.game_rounds for all to service_role using (true) with check (true);
create policy if not exists "service_writes_entries" on public.entries for all to service_role using (true) with check (true);
create policy if not exists "service_writes_actions" on public.actions for all to service_role using (true) with check (true);
create policy if not exists "service_writes_ledger" on public.credit_ledger for all to service_role using (true) with check (true);
create policy if not exists "service_writes_iap" on public.iap_purchases for all to service_role using (true) with check (true);
create policy if not exists "service_writes_results" on public.results for all to service_role using (true) with check (true);
create policy if not exists "service_writes_members" on public.members for all to service_role using (true) with check (true);


