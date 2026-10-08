-- MILK ROUTE LIVE MULTIPLAYER SCHEMA
create extension if not exists pgcrypto;

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  round integer not null default 1,
  status text not null default 'lobby',
  event jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  name text not null,
  members text,
  cash numeric not null default 100000,
  trust numeric not null default 82,
  score numeric not null default 0,
  alive boolean not null default true,
  decisions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists teams_session_name_unique
on public.teams (session_id, lower(name));

create index if not exists teams_session_score_idx
on public.teams (session_id, score desc);

alter table public.game_sessions enable row level security;
alter table public.teams enable row level security;

drop policy if exists "read sessions" on public.game_sessions;
drop policy if exists "create sessions" on public.game_sessions;
drop policy if exists "update sessions" on public.game_sessions;
drop policy if exists "read teams" on public.teams;
drop policy if exists "create teams" on public.teams;
drop policy if exists "update teams" on public.teams;

create policy "read sessions" on public.game_sessions for select using (true);
create policy "create sessions" on public.game_sessions for insert with check (true);
create policy "update sessions" on public.game_sessions for update using (true) with check (true);

create policy "read teams" on public.teams for select using (true);
create policy "create teams" on public.teams for insert with check (true);
create policy "update teams" on public.teams for update using (true) with check (true);

grant select, insert, update on public.game_sessions to anon, authenticated;
grant select, insert, update on public.teams to anon, authenticated;

do $$
begin
  alter publication supabase_realtime add table public.game_sessions;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.teams;
exception when duplicate_object then null;
end $$;