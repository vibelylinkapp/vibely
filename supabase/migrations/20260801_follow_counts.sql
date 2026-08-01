-- 20260801_follow_counts.sql
-- Follower / following counts for any profile, readable under the counts-only
-- RLS posture from 20260801_follows.sql. SECURITY DEFINER so the aggregate sees
-- all rows regardless of the caller's row-level select policy; only a number is
-- ever returned, never the underlying rows. Run 20260801_follows.sql first.

create or replace function public.follower_count(uid uuid)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*) from public.follows where following_id = uid;
$$;

create or replace function public.following_count(uid uuid)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*) from public.follows where follower_id = uid;
$$;

grant execute on function public.follower_count(uuid) to authenticated;
grant execute on function public.following_count(uuid) to authenticated;
