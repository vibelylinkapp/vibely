-- =====================================================================
-- Vibely - Post moderation (0016)
-- Lets members report or hide individual feed posts. Post reports reuse the
-- existing `reports` moderation queue (so they surface in /admin/reports) by
-- carrying an optional post_id pointer at the reported post. `post_hides`
-- records per-member hidden posts so a hidden or reported post drops out of
-- that member's own feed.
-- Run in the Supabase SQL Editor after 0015_post_comments.sql.
-- =====================================================================

-- ---- Reports: point at a specific post -----------------------------
alter table public.reports
  add column if not exists post_id uuid references public.posts(id) on delete cascade;
create index if not exists reports_post_idx on public.reports (post_id);

-- ---- Per-member hidden posts ---------------------------------------
create table if not exists public.post_hides (
  post_id     uuid not null references public.posts(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, profile_id)
);
create index if not exists post_hides_profile_idx on public.post_hides (profile_id);

alter table public.post_hides enable row level security;

drop policy if exists post_hides_select_self on public.post_hides;
create policy post_hides_select_self on public.post_hides
  for select to authenticated using (profile_id = auth.uid());

drop policy if exists post_hides_insert_self on public.post_hides;
create policy post_hides_insert_self on public.post_hides
  for insert to authenticated with check (profile_id = auth.uid());

drop policy if exists post_hides_delete_self on public.post_hides;
create policy post_hides_delete_self on public.post_hides
  for delete to authenticated using (profile_id = auth.uid());
