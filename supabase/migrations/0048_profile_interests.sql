-- =====================================================================
-- 0048_profile_interests.sql
--
-- Adds profiles.interests: up to 8 tags from the fixed list in
-- lib/interests.ts (Music, Football, Hiking, ...). Used on profile cards,
-- in onboarding / profile edit, and as a Discover filter.
--
-- The app tolerates this column being absent (writes are best-effort and
-- the Discover interest filter simply returns nobody), but nothing is
-- saved until this runs. Safe to run more than once. Run after 0047.
-- =====================================================================

alter table public.profiles
  add column if not exists interests text[] not null default '{}';

alter table public.profiles drop constraint if exists profiles_interests_max;
alter table public.profiles
  add constraint profiles_interests_max
  check (cardinality(interests) <= 8);

-- GIN index so `interests @> array['Hiking']` stays fast as members grow.
create index if not exists profiles_interests_gin
  on public.profiles using gin (interests);

-- No new RLS policy is needed: members already update only their own
-- profiles row, and interests are as public as the rest of the profile.

-- Verify:
--   select count(*) from public.profiles where cardinality(interests) > 0;
