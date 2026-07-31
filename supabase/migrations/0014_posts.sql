-- =====================================================================
-- Vibely - Social feed (0014)
-- Photo posts with captions and per-user likes. Posts are readable by any
-- authenticated member; likes are one row per (post, member) and toggle off
-- when re-liked. Media lives in a public "post-media" bucket, written under
-- a top-level folder named after the uploader's uid: post-media/<uid>/<file>.
-- Run in the Supabase SQL Editor after 0013_message_reactions.sql.
-- =====================================================================

-- ---- Posts ----------------------------------------------------------
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles(id) on delete cascade,
  media_url   text,
  caption     text,
  created_at  timestamptz not null default now()
);
create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists posts_author_idx  on public.posts (author_id);

alter table public.posts enable row level security;

drop policy if exists posts_select_auth on public.posts;
create policy posts_select_auth on public.posts
  for select to authenticated using (true);

drop policy if exists posts_insert_self on public.posts;
create policy posts_insert_self on public.posts
  for insert to authenticated with check (author_id = auth.uid());

drop policy if exists posts_update_own on public.posts;
create policy posts_update_own on public.posts
  for update to authenticated using (author_id = auth.uid());

drop policy if exists posts_delete_own on public.posts;
create policy posts_delete_own on public.posts
  for delete to authenticated using (author_id = auth.uid());

-- ---- Post likes -----------------------------------------------------
create table if not exists public.post_likes (
  post_id     uuid not null references public.posts(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, profile_id)
);
create index if not exists post_likes_post_idx on public.post_likes (post_id);

alter table public.post_likes enable row level security;

drop policy if exists post_likes_select_auth on public.post_likes;
create policy post_likes_select_auth on public.post_likes
  for select to authenticated using (true);

drop policy if exists post_likes_insert_self on public.post_likes;
create policy post_likes_insert_self on public.post_likes
  for insert to authenticated with check (profile_id = auth.uid());

drop policy if exists post_likes_delete_self on public.post_likes;
create policy post_likes_delete_self on public.post_likes
  for delete to authenticated using (profile_id = auth.uid());

-- Stream posts + likes live to clients.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'post_likes'
  ) then
    alter publication supabase_realtime add table public.post_likes;
  end if;
end $$;
alter table public.post_likes replica identity full;

-- ---- Public media bucket for post photos ----------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-media', 'post-media', true, 10485760,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 10485760,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "post_media_read_all" on storage.objects;
create policy "post_media_read_all"
  on storage.objects for select
  to public
  using (bucket_id = 'post-media');

drop policy if exists "post_media_insert_own" on storage.objects;
create policy "post_media_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "post_media_delete_own" on storage.objects;
create policy "post_media_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
