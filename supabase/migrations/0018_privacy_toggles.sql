-- =====================================================================
-- Vibely - Privacy toggles (0018)
-- Two member-controlled switches on profiles:
--   show_location     - appear in People Nearby and on the map / heatmap
--   show_verification - display the verified badge to other members
-- Both default true, so existing members see no behaviour change. The
-- nearby_profiles helper is updated to honour them at the source: members
-- who hide their location drop out of nearby/map results entirely, and the
-- verified flag is masked for members who hide their verification.
-- Run in the Supabase SQL Editor after 0017_seed_demo_people.sql.
-- =====================================================================

alter table public.profiles
  add column if not exists show_location boolean not null default true,
  add column if not exists show_verification boolean not null default true;

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
    and not p.is_private and not p.invisible_mode and p.onboarding_done
    and p.show_location
    and st_dwithin(p.geo, st_setsrid(st_makepoint(in_lng,in_lat),4326)::geography, radius_m)
    and (wanted is null or exists (
      select 1 from public.profile_intents pi where pi.profile_id = p.id and pi.intent = wanted))
  order by distance_m asc
  limit 200;
$$;
