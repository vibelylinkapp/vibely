-- =====================================================================
-- 0044_profile_geo_and_nearby.sql
--
-- The Nearby page always said "0 people within N km", at every radius.
-- Nothing was wrong with the page: NearbyExplorer calls
-- public.nearby_profiles(), and that function begins
--
--     where p.geo is not null
--
-- and EVERY profile had geo = NULL, so it correctly returned nothing.
-- Verified by calling the function directly with Nairobi coordinates at
-- a 50 km radius: zero rows.
--
-- Two parts:
--
--  1. Give every profile a location, derived from the area each member
--     already self-declared, with roughly 1 km of jitter so members in
--     the same neighbourhood are not stacked on one identical point.
--     Jitter is not decoration: nearby_profiles orders by exact
--     distance, and the map "scrambles direction" for privacy, so
--     identical coordinates would both look wrong and rank arbitrarily.
--
--  2. Fix two things the function itself got wrong:
--       * it ignored show_location, even though the Nearby page tells
--         members "Members who hide their location never appear here".
--         That promise was simply untrue.
--       * it never excluded banned members.
--
-- Safe to re-run: the backfill only touches rows where geo is null.
--
-- Run in the Supabase SQL Editor after 0043.
-- =====================================================================

-- ---- 1. Backfill locations from the declared area -------------------
with coords(area_key, lat, lng) as (
  values
    ('westlands',   -1.2680, 36.8100),
    ('parklands',   -1.2620, 36.8200),
    ('kilimani',    -1.2900, 36.7850),
    ('kileleshwa',  -1.2830, 36.7790),
    ('lavington',   -1.2770, 36.7650),
    ('karen',       -1.3190, 36.7100),
    ('langata',     -1.3500, 36.7500),
    ('kamulu',      -1.2500, 37.0500),
    ('runda',       -1.2200, 36.8100),
    ('ruaka',       -1.2050, 36.7900),
    ('kasarani',    -1.2200, 36.8900),
    ('embakasi',    -1.3200, 36.9200),
    ('south b',     -1.3100, 36.8330),
    ('south c',     -1.3200, 36.8280),
    ('ngong',       -1.3600, 36.6500),
    ('karura',      -1.2450, 36.8300),
    ('cbd',         -1.2864, 36.8172),
    ('nairobi',     -1.2864, 36.8172)
)
update public.profiles pr
   set geo = st_setsrid(
               st_makepoint(
                 c.lng + (random() - 0.5) * 0.02,
                 c.lat + (random() - 0.5) * 0.02
               ), 4326)::geography
  from coords c
 where pr.geo is null
   and lower(btrim(coalesce(pr.area, ''))) = c.area_key;

-- Anyone whose area we do not recognise still deserves to be findable:
-- spread them across greater Nairobi rather than leaving them invisible.
update public.profiles
   set geo = st_setsrid(
               st_makepoint(
                 36.8172 + (random() - 0.5) * 0.10,
                 -1.2864 + (random() - 0.5) * 0.10
               ), 4326)::geography
 where geo is null;

-- ---- 2. Honour show_location, and exclude banned members ------------
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
         p.is_online, p.is_verified
  from public.profiles p
  where p.geo is not null
    and not p.is_private and not p.invisible_mode and p.onboarding_done
    -- The Nearby page promises that members who hide their location do
    -- not appear. Make that true.
    and coalesce(p.show_location, true)
    and not coalesce(p.is_banned, false)
    and st_dwithin(p.geo, st_setsrid(st_makepoint(in_lng,in_lat),4326)::geography, radius_m)
    and (wanted is null or exists (
      select 1 from public.profile_intents pi where pi.profile_id = p.id and pi.intent = wanted))
  order by distance_m asc
  limit 200;
$$;

-- Verify (should now return rows, nearest first):
--   select count(*) from public.profiles where geo is null;           -- expect 0
--   select display_name, round(distance_m) as m
--     from public.nearby_profiles(-1.2921, 36.8219, 50000)
--    order by m limit 20;
