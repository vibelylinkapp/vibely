-- 20260801_like_delete_policy.sql
-- Allow a member to remove their OWN like. Used by the swipe-deck rewind/undo
-- (POST /api/unlike). Idempotent and safe to run more than once.

alter table public.likes enable row level security;

drop policy if exists "likes_delete_own" on public.likes;
create policy "likes_delete_own"
  on public.likes for delete
  using (auth.uid() = liker_id);
