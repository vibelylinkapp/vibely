-- =====================================================================
-- Vibely — Profile boosts (0009)
-- A boost lifts a member to the top of Discover for 30 minutes. Quota is
-- enforced server-side by tier (Gold = 5 / 30 days, VIP = unlimited).
-- Run after 0008_mpesa.sql.
-- =====================================================================
create table if not exists public.boosts (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  started_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);
create index if not exists boosts_expires_idx on public.boosts (expires_at desc);
create index if not exists boosts_profile_idx on public.boosts (profile_id, created_at desc);

alter table public.boosts enable row level security;

-- Any authenticated member can read boosts (Discover ranks boosted profiles).
drop policy if exists boosts_read on public.boosts;
create policy boosts_read on public.boosts
  for select using (auth.role() = 'authenticated');

-- A member manages only their own boosts; the API validates quota before insert.
drop policy if exists boosts_write on public.boosts;
create policy boosts_write on public.boosts
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
