-- =====================================================================
-- Vibely - Member feedback (0028)
-- A channel for members to tell us how to improve their experience.
-- Submissions land in /admin/feedback. Admins can also request feedback by
-- posting an announcement (0027) that links to /feedback.
--
-- Members can insert and read their own; admins read everything via the
-- service role. Run in the Supabase SQL Editor after 0027.
-- =====================================================================

create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  rating      smallint check (rating is null or rating between 1 and 5),
  message     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists feedback_created_idx on public.feedback (created_at desc);

alter table public.feedback enable row level security;

drop policy if exists feedback_insert_own on public.feedback;
create policy feedback_insert_own on public.feedback
  for insert to authenticated with check (profile_id = auth.uid());

drop policy if exists feedback_select_own on public.feedback;
create policy feedback_select_own on public.feedback
  for select to authenticated using (profile_id = auth.uid());
