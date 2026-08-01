-- =====================================================================
-- Vibely - Follow edge check (20260801_follows_edge)
-- follows_edge(a, b) returns true when member a follows member b.
-- Needed because the follows table's counts-only RLS (follows_read_own)
-- only lets a member read their OWN follow rows, so a profile page can't
-- directly answer "does this other member follow me?". Mirrors the
-- follower_count / following_count SECURITY DEFINER pattern in
-- 20260801_follow_counts.sql (returns only a boolean, never the rows).
-- Requires 20260801_follows.sql. Run in the Supabase SQL Editor.
-- =====================================================================

create or replace function public.follows_edge(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.follows
    where follower_id = a and following_id = b
  );
$$;

grant execute on function public.follows_edge(uuid, uuid) to authenticated;
