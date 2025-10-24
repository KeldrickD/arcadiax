-- ArcadiaX initial schema (phase 1)

-- Ensure UUID generator available
create extension if not exists pgcrypto;

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

-- Optional profile fields for feed/widgets
alter table public.members add column if not exists display_name text;
alter table public.members add column if not exists avatar_url text;

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

-- Idempotency support for ledger
alter table public.credit_ledger add column if not exists idempotency_key text unique;

-- Join attempts tracking and DB-level rate limiter
create table if not exists public.join_attempts(
  account_id uuid not null,
  member_id uuid not null,
  at timestamptz not null default now()
);

create or replace function public.arcx_rate_limit_join(_account uuid, _member uuid, _max int, _seconds int)
returns void language plpgsql as $$
declare cnt int;
begin
  delete from public.join_attempts where at < now() - interval '10 minutes';
  insert into public.join_attempts(account_id, member_id) values (_account, _member);
  select count(*) into cnt from public.join_attempts
  where account_id=_account and member_id=_member and at > now() - make_interval(secs => _seconds);
  if cnt > _max then
    raise exception 'RATE_LIMIT';
  end if;
end; $$;

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

-- Webhook idempotency store
create table if not exists public.webhook_events (
  event_id text primary key,
  received_at timestamptz not null default now()
);

-- Prevent negative balances
create or replace function public.ensure_non_negative_balance() returns trigger as $$
begin
  if new.balance_credits < 0 then
    raise exception 'NEGATIVE_BALANCE';
  end if;
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_non_negative_balance on public.members;
create trigger trg_non_negative_balance before update of balance_credits on public.members
for each row execute function public.ensure_non_negative_balance();

-- Queue of upcoming rounds (server-side schedules)
create table if not exists public.rounds_queue (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  type text not null check (type in ('trivia','prediction','raffle')),
  payload jsonb not null default '{}',
  answer jsonb not null default '{}',
  starts_at timestamptz not null,
  duration_sec integer not null default 20,
  status text not null default 'pending', -- pending|running|completed|cancelled
  created_at timestamptz not null default now()
);
create index if not exists rounds_queue_session_idx on public.rounds_queue(session_id);
create index if not exists rounds_queue_starts_idx on public.rounds_queue(starts_at);

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

-- Tighten reads: drop public reads and allow service_role only
drop policy if exists "read_all_public" on public.accounts;
drop policy if exists "read_all_public" on public.members;
drop policy if exists "read_all_public" on public.games;
drop policy if exists "read_all_public" on public.game_sessions;
drop policy if exists "read_all_public" on public.game_rounds;
drop policy if exists "read_all_public" on public.entries;
drop policy if exists "read_all_public" on public.actions;
drop policy if exists "read_all_public" on public.credit_ledger;
drop policy if exists "read_all_public" on public.iap_purchases;

create policy if not exists "service_reads_accounts" on public.accounts for select to service_role using (true);
create policy if not exists "service_reads_members" on public.members for select to service_role using (true);
create policy if not exists "service_reads_games" on public.games for select to service_role using (true);
create policy if not exists "service_reads_sessions" on public.game_sessions for select to service_role using (true);
create policy if not exists "service_reads_rounds" on public.game_rounds for select to service_role using (true);
create policy if not exists "service_reads_entries" on public.entries for select to service_role using (true);
create policy if not exists "service_reads_actions" on public.actions for select to service_role using (true);
create policy if not exists "service_reads_ledger" on public.credit_ledger for select to service_role using (true);
create policy if not exists "service_reads_iap" on public.iap_purchases for select to service_role using (true);

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
-- removed broken policy for non-existent table public.results
create policy if not exists "service_writes_members" on public.members for all to service_role using (true) with check (true);
-- Function: Settle active trivia round for a session
-- Determines winners by comparing latest action payload to the round's answer
create or replace function public.arcx_settle_trivia_round(p_session_id uuid)
returns jsonb as $$
declare
  v_round record;
  v_answer_id text;
  v_winners uuid[] := '{}';
  v_entry_cost integer := 0;
  v_action record;
begin
  select r.* into v_round
  from public.game_rounds r
  where r.session_id = p_session_id and r.state = 'active'
  order by r.started_at desc nulls last
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'NO_ACTIVE_ROUND');
  end if;

  v_answer_id := coalesce((v_round.answer->>'answerId'), null);
  if v_answer_id is null then
    return jsonb_build_object('ok', false, 'error', 'MISSING_ANSWER');
  end if;

  -- get entry cost for payouts reference (optional)
  select entry_cost into v_entry_cost from public.game_sessions where id = p_session_id;

  -- iterate latest action per member
  for v_action in (
    select a.member_id, a.payload
    from public.actions a
    where a.round_id = v_round.id
    and a.created_at = (
      select max(a2.created_at) from public.actions a2
      where a2.round_id = a.round_id and a2.member_id = a.member_id
    )
  ) loop
    if (v_action.payload->>'answerId') = v_answer_id or (v_action.payload->>'selectedId') = v_answer_id then
      v_winners := array_append(v_winners, v_action.member_id);
      -- ledger award (fixed demo amount)
      begin
        insert into public.credit_ledger(member_id, type, amount, reference_type, reference_id, notes, idempotency_key)
        values (v_action.member_id, 'award', 50, 'session', p_session_id, 'trivia payout', concat('trivia:', v_round.id, ':', v_action.member_id::text))
        on conflict (idempotency_key) do nothing;
      exception when others then
        -- ignore award errors
      end;
    end if;
  end loop;

  -- close and mark settled
  update public.game_rounds set state = 'settled', ended_at = now() where id = v_round.id;
  update public.game_sessions set status = 'closed' where id = p_session_id and status = 'live';

  return jsonb_build_object('ok', true, 'winners', v_winners, 'answerId', v_answer_id);
end;
$$ language plpgsql security definer;

-- No-op refresh function to prevent errors if called
create or replace function public.refresh_wallets()
returns void as $$ begin return; end; $$ language plpgsql;


-- Per-account notification and game-type settings
create table if not exists public.account_settings (
  account_id uuid primary key references public.accounts(id) on delete cascade,
  allow_raffles boolean,
  allow_predictions boolean,
  quiet_start_hour integer,
  quiet_end_hour integer,
  push_daily_cap integer,
  feed_daily_cap integer,
  updated_at timestamptz not null default now()
);
alter table public.account_settings enable row level security;
drop policy if exists "account_settings_service" on public.account_settings;
create policy "account_settings_service" on public.account_settings for all to service_role using (true) with check (true);

-- System KV for lightweight app metadata (e.g., last scheduler tick)
create table if not exists public.system_kv (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.system_kv enable row level security;
drop policy if exists "system_kv_service" on public.system_kv;
create policy "system_kv_service" on public.system_kv for all to service_role using (true) with check (true);

-- Notification counters for quiet hours and daily caps
create table if not exists public.notify_counters (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  kind text not null check (kind in ('push','feed')),
  day date not null,
  count integer not null default 0,
  unique (account_id, kind, day)
);
alter table public.notify_counters enable row level security;
drop policy if exists "notify_counters_service" on public.notify_counters;
create policy "notify_counters_service" on public.notify_counters for all to service_role using (true) with check (true);



