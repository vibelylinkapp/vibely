-- =====================================================================
-- Vibely — Web Push subscriptions (0006)
-- Stores browser push subscriptions. Sending happens from the Next.js
-- /api/push/send route (web-push + VAPID). Run after 0005_matching.sql.
-- =====================================================================
create table if not exists public.push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  endpoint     text not null unique,
  subscription jsonb not null,
  created_at   timestamptz not null default now()
);
create index if not exists push_subscriptions_profile_idx
  on public.push_subscriptions (profile_id);

alter table public.push_subscriptions enable row level security;

-- Owner manages their own subscriptions; the server reads all via service role.
drop policy if exists push_subs_rw on public.push_subscriptions;
create policy push_subs_rw on public.push_subscriptions
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
