-- 20260801_follows.sql
-- Follows: one-directional social follow, separate from likes/matches.
-- Ships with a "counts-only" privacy posture: a member can read only their own
-- follow rows; follower/following COUNTS for any profile are exposed via
-- SECURITY DEFINER functions added in the follow-UI PR (PR B).
--
-- To make the whole follow graph public instead (anyone can list who follows
-- whom), replace the follows_read_own policy below with:
--   create policy "follows_read_all" on public.follows for select using (true);

create table if not exists public.follows (
  follower_id  uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self check (follower_id <> following_id)
);

create index if not exists follows_following_idx
  on public.follows (following_id);

alter table public.follows enable row level security;

drop policy if exists "follows_read_own" on public.follows;
create policy "follows_read_own"
  on public.follows for select
  using (auth.uid() = follower_id);

drop policy if exists "follows_insert_own" on public.follows;
create policy "follows_insert_own"
  on public.follows for insert
  with check (auth.uid() = follower_id);

drop policy if exists "follows_delete_own" on public.follows;
create policy "follows_delete_own"
  on public.follows for delete
  using (auth.uid() = follower_id);
