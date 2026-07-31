-- =====================================================================
-- Vibely — Nudge log (0010)
-- Records member nudges (e.g. win-back pushes) so we never send the same
-- nudge twice. `ref` scopes a nudge to a specific event — for win-backs it is
-- the lapsed subscription's expires_at, so a member who lapses, renews, and
-- lapses again later is eligible for a fresh nudge.
-- Run after 0009_boosts.sql.
-- =====================================================================
create table if not exists public.nudges (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  kind        text not null,
  ref         text,
  created_at  timestamptz not null default now(),
  unique (profile_id, kind, ref)
);
create index if not exists nudges_profile_kind_idx
  on public.nudges (profile_id, kind);

-- Server-only: written and read exclusively by service-role routes (the cron).
-- RLS is enabled with no policies, so ordinary clients get nothing.
alter table public.nudges enable row level security;
