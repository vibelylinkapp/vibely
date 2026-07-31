-- =====================================================================
-- Vibely - Admin announcements / home notice (0027)
-- Lets an admin post a notice that shows as a banner at the top of Home
-- (e.g. "Vibely Live at The Alchemist this Friday"). Members can dismiss it;
-- dismissal is per-device (localStorage) so it is not stored here.
--
-- Writes are admin-only via the service role (which bypasses RLS). Members
-- can only read. Run in the Supabase SQL Editor after 0026.
-- =====================================================================

create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  body        text not null,
  link        text,
  active      boolean not null default true,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists announcements_active_idx
  on public.announcements (active, created_at desc);

alter table public.announcements enable row level security;

-- Any signed-in member can read; the app surfaces only the latest active one.
drop policy if exists announcements_read on public.announcements;
create policy announcements_read on public.announcements
  for select using (auth.role() = 'authenticated');

-- No member writes. Admins create / toggle / delete through the service role,
-- which bypasses RLS, so there is intentionally no insert/update/delete policy.
