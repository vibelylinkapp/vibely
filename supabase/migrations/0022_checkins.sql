-- =====================================================================
-- Vibely - Live check-ins (0022)
-- A check-in is an ephemeral "I'm out right now, open to meet" signal. It
-- expires automatically (default 4 hours) and is only visible while active.
-- Members manage their own check-ins; everyone signed in sees active ones.
-- Run in the Supabase SQL Editor after 0021_seed_events.sql.
-- =====================================================================

create table if not exists public.checkins (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  place       text not null,
  area        text,
  county      text,
  note        text,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '4 hours')
);

create index if not exists checkins_active_idx on public.checkins (expires_at desc);
create index if not exists checkins_profile_idx on public.checkins (profile_id);

alter table public.checkins enable row level security;

drop policy if exists checkins_read on public.checkins;
create policy checkins_read on public.checkins for select to authenticated
  using (expires_at > now() or profile_id = auth.uid());

drop policy if exists checkins_insert on public.checkins;
create policy checkins_insert on public.checkins for insert to authenticated
  with check (profile_id = auth.uid());

drop policy if exists checkins_delete on public.checkins;
create policy checkins_delete on public.checkins for delete to authenticated
  using (profile_id = auth.uid());
