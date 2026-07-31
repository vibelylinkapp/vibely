-- =====================================================================
-- Vibely - Post comments (0015)
-- Threaded-flat comments on feed posts. Readable by any authenticated member;
-- a member may write comments as themselves and delete their own. Comments
-- stream live to clients over Supabase Realtime.
-- Run in the Supabase SQL Editor after 0014_posts.sql.
-- =====================================================================
create table if not exists public.post_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists post_comments_post_idx
  on public.post_comments (post_id, created_at);

alter table public.post_comments enable row level security;

drop policy if exists post_comments_select_auth on public.post_comments;
create policy post_comments_select_auth on public.post_comments
  for select to authenticated using (true);

drop policy if exists post_comments_insert_self on public.post_comments;
create policy post_comments_insert_self on public.post_comments
  for insert to authenticated with check (author_id = auth.uid());

drop policy if exists post_comments_delete_self on public.post_comments;
create policy post_comments_delete_self on public.post_comments
  for delete to authenticated using (author_id = auth.uid());

-- Stream comment inserts/deletes live.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'post_comments'
  ) then
    alter publication supabase_realtime add table public.post_comments;
  end if;
end $$;
alter table public.post_comments replica identity full;
