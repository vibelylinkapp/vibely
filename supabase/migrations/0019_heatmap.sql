-- =====================================================================
-- Vibely - Live heatmap (0019)
-- Aggregates member density into privacy-safe grid cells for the live
-- heatmap. Only cell centres + counts are returned - never individuals or
-- exact coordinates - and members who hide their location, are private, are
-- in invisible mode, or have not finished onboarding are excluded. An
-- optional online_only flag powers the "live / online now" view.
-- Run in the Supabase SQL Editor after 0018_privacy_toggles.sql.
-- =====================================================================

create or replace function public.heatmap_cells(
  cell double precision default 0.02,
  online_only boolean default false
) returns table (lat double precision, lng double precision, weight bigint)
language sql stable as $$
  select round(st_y(p.geo::geometry) / cell)::double precision * cell as lat,
         round(st_x(p.geo::geometry) / cell)::double precision * cell as lng,
         count(*)::bigint as weight
  from public.profiles p
  where p.geo is not null
    and not p.is_private and not p.invisible_mode and p.onboarding_done
    and p.show_location
    and (online_only = false or p.is_online)
  group by 1, 2;
$$;

grant execute on function public.heatmap_cells(double precision, boolean)
  to authenticated, anon;
