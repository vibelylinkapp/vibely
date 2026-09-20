-- =====================================================================
-- Vibely - Mark and contain demo content (0031)
--
-- Migrations 0017, 0021, 0023 and 0026 seeded demo members, plans, events
-- and stories so the product did not look empty pre-launch. Nothing in the
-- schema distinguished them from real members, which is a problem for a
-- landing page headlined "Real people".
--
-- This migration:
--   1. adds an is_demo flag to profiles, plans, events and stories;
--   2. back-fills it for everything the seed migrations created;
--   3. drops demo members out of People Nearby and the map;
--   4. adds purge_demo_content(), one call that removes the lot at launch.
--
-- Run in the Supabase SQL Editor after 0030_account_deletion.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Flags
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists is_demo boolean not null default false;
alter table public.plans    add column if not exists is_demo boolean not null default false;
alter table public.events   add column if not exists is_demo boolean not null default false;
alter table public.stories  add column if not exists is_demo boolean not null default false;

create index if not exists profiles_is_demo_idx on public.profiles (is_demo) where is_demo;
create index if not exists events_is_demo_idx   on public.events   (is_demo) where is_demo;

-- ---------------------------------------------------------------------
-- 2. Back-fill
-- ---------------------------------------------------------------------

-- Seeded members: 0017 tagged every one with raw_user_meta_data->>'seed'.
update public.profiles p
   set is_demo = true
  from auth.users u
 where u.id = p.id
   and u.raw_user_meta_data->>'seed' = 'true'
   and not p.is_demo;

-- Anything hosted or posted by a demo member is demo content.
update public.plans
   set is_demo = true
 where not is_demo
   and host_id in (select id from public.profiles where is_demo);

update public.stories
   set is_demo = true
 where not is_demo
   and profile_id in (select id from public.profiles where is_demo);

-- Seeded events (0021) were inserted with created_by NULL under the
-- "Vibely Events" house name. A real member-created event always has an author.
update public.events
   set is_demo = true
 where not is_demo
   and created_by is null;

-- ---------------------------------------------------------------------
-- 3. Keep demo members out of People Nearby and the map
--    (same body as 0018, plus the is_demo guard)
-- ---------------------------------------------------------------------
create or replace function public.nearby_profiles(
  in_lat double precision,
  in_lng double precision,
  radius_m double precision default 25000,
  wanted intent_t default null
) returns table (
  id uuid, display_name text, avatar_url text, county text,
  distance_m double precision, is_online boolean, is_verified boolean
) language sql stable as $$
  select p.id, p.display_name, p.avatar_url, p.county,
         st_distance(p.geo, st_setsrid(st_makepoint(in_lng,in_lat),4326)::geography) as distance_m,
         p.is_online, (p.is_verified and p.show_verification) as is_verified
  from public.profiles p
  where p.geo is not null
    and not p.is_demo
    and not p.is_private and not p.invisible_mode and p.onboarding_done
    and p.show_location
    and st_dwithin(p.geo, st_setsrid(st_makepoint(in_lng,in_lat),4326)::geography, radius_m)
    and (wanted is null or exists (
      select 1 from public.profile_intents pi where pi.profile_id = p.id and pi.intent = wanted))
  order by distance_m asc
  limit 200;
$$;

-- ---------------------------------------------------------------------
-- 4. One call to remove every trace of the demo data at launch
--
--    select public.purge_demo_content();
--
--    Deleting the auth.users rows cascades to profiles, intents, plans,
--    participants, stories, posts, likes and subscriptions. Seeded events
--    have no author to cascade from, so they are deleted directly.
-- ---------------------------------------------------------------------
create or replace function public.purge_demo_content()
returns table (events_removed int, members_removed int)
language plpgsql
security definer
set search_path = public
as $$
declare
  ev int;
  mem int;
begin
  delete from public.events where is_demo;
  get diagnostics ev = row_count;

  delete from auth.users
   where raw_user_meta_data->>'seed' = 'true';
  get diagnostics mem = row_count;

  return query select ev, mem;
end $$;

revoke all on function public.purge_demo_content() from public, anon, authenticated;

comment on function public.purge_demo_content() is
  'Removes all seeded demo members, plans, stories and events. Service role '
  'only. Run once before public launch.';
