-- Vibely — Profile Highlights
-- Persistent, curated highlight items shown on a member's profile (unlike the
-- 24-hour "stories"). Media reuses the existing PUBLIC "avatars" storage bucket
-- under <uid>/highlights/..., exactly like gallery photos and stories — so
-- there is NO new storage bucket and NO new storage policy to create here.
--
-- Run this ONCE in the Supabase dashboard: SQL Editor -> New query -> paste ->
-- Run. It is idempotent and safe to re-run.

create table if not exists public.highlights (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  title       text not null,
  media_url   text not null,
  caption     text,
  position    integer not null default 0,
  is_approved boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists highlights_profile_id_idx
  on public.highlights (profile_id, position);

alter table public.highlights enable row level security;

-- READ: anyone signed in can see the highlights of a public, non-banned member;
-- you can always see your own.
drop policy if exists "highlights_select" on public.highlights;
create policy "highlights_select" on public.highlights
  for select to authenticated
  using (
    profile_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = highlights.profile_id
        and coalesce(p.is_private, false) = false
        and coalesce(p.is_banned, false) = false
    )
  );

-- WRITE: you can only create / edit / delete your own highlights.
drop policy if exists "highlights_insert" on public.highlights;
create policy "highlights_insert" on public.highlights
  for insert to authenticated
  with check (profile_id = auth.uid());

drop policy if exists "highlights_update" on public.highlights;
create policy "highlights_update" on public.highlights
  for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists "highlights_delete" on public.highlights;
create policy "highlights_delete" on public.highlights
  for delete to authenticated
  using (profile_id = auth.uid());
