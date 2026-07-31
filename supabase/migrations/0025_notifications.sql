-- =====================================================================
-- Vibely - Notifications inbox (0025)
-- A per-member activity feed. Rows are written ONLY by the SECURITY DEFINER
-- triggers below (there is deliberately no insert policy for members), and a
-- member can read / mark-read / delete only their own. Covers: mutual matches,
-- post likes, post comments, plan joins, and event approve/reject.
-- Run in the Supabase SQL Editor after 0024_event_moderation.sql.
-- =====================================================================

create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id     uuid references public.profiles(id) on delete set null,
  type         text not null,   -- match | post_like | post_comment | plan_join | event_approved | event_rejected
  entity_type  text,            -- post | plan | event | profile
  entity_id    uuid,
  link         text,            -- precomputed in-app deep link
  body         text,            -- optional preview (comment text, plan/event title, reject reason)
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists notifications_recipient_idx
  on public.notifications (recipient_id, created_at desc);
create index if not exists notifications_unread_idx
  on public.notifications (recipient_id) where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select to authenticated using (recipient_id = auth.uid());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

drop policy if exists notifications_delete_own on public.notifications;
create policy notifications_delete_own on public.notifications
  for delete to authenticated using (recipient_id = auth.uid());
-- (No insert policy: only the SECURITY DEFINER triggers below create rows.)

-- Stream new notifications live so the nav bell can update instantly.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- ---- post like -> notify the post author ---------------------------
create or replace function public.notify_post_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_author uuid;
begin
  select author_id into v_author from public.posts where id = new.post_id;
  if v_author is not null and v_author <> new.profile_id then
    insert into public.notifications(recipient_id, actor_id, type, entity_type, entity_id, link)
    values (v_author, new.profile_id, 'post_like', 'post', new.post_id, '/posts/' || new.post_id);
  end if;
  return new;
end $$;
drop trigger if exists notify_post_like_trg on public.post_likes;
create trigger notify_post_like_trg after insert on public.post_likes
  for each row execute function public.notify_post_like();

-- ---- post comment -> notify the post author ------------------------
create or replace function public.notify_post_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_author uuid;
begin
  select author_id into v_author from public.posts where id = new.post_id;
  if v_author is not null and v_author <> new.author_id then
    insert into public.notifications(recipient_id, actor_id, type, entity_type, entity_id, link, body)
    values (v_author, new.author_id, 'post_comment', 'post', new.post_id, '/posts/' || new.post_id, left(new.body, 140));
  end if;
  return new;
end $$;
drop trigger if exists notify_post_comment_trg on public.post_comments;
create trigger notify_post_comment_trg after insert on public.post_comments
  for each row execute function public.notify_post_comment();

-- ---- plan join -> notify the host ----------------------------------
create or replace function public.notify_plan_join()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_host uuid; v_title text;
begin
  select host_id, title into v_host, v_title from public.plans where id = new.plan_id;
  if v_host is not null and v_host <> new.profile_id then
    insert into public.notifications(recipient_id, actor_id, type, entity_type, entity_id, link, body)
    values (v_host, new.profile_id, 'plan_join', 'plan', new.plan_id, '/plans/' || new.plan_id, v_title);
  end if;
  return new;
end $$;
drop trigger if exists notify_plan_join_trg on public.plan_participants;
create trigger notify_plan_join_trg after insert on public.plan_participants
  for each row execute function public.notify_plan_join();

-- ---- mutual like -> notify both people it's a match ----------------
create or replace function public.notify_like_match()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1 from public.likes l
    where l.liker_id = new.liked_id and l.liked_id = new.liker_id
  ) then
    insert into public.notifications(recipient_id, actor_id, type, entity_type, entity_id, link)
    values
      (new.liker_id, new.liked_id, 'match', 'profile', new.liked_id, '/messages'),
      (new.liked_id, new.liker_id, 'match', 'profile', new.liker_id, '/messages');
  end if;
  return new;
end $$;
drop trigger if exists notify_like_match_trg on public.likes;
create trigger notify_like_match_trg after insert on public.likes
  for each row execute function public.notify_like_match();

-- ---- event moderation -> notify the host ---------------------------
create or replace function public.notify_event_moderation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.created_by is not null and new.status is distinct from old.status then
    if new.status = 'published' then
      insert into public.notifications(recipient_id, actor_id, type, entity_type, entity_id, link, body)
      values (new.created_by, null, 'event_approved', 'event', new.id, '/events/' || new.id, new.title);
    elsif new.status = 'rejected' then
      insert into public.notifications(recipient_id, actor_id, type, entity_type, entity_id, link, body)
      values (new.created_by, null, 'event_rejected', 'event', new.id, '/events/' || new.id, coalesce(new.rejected_reason, new.title));
    end if;
  end if;
  return new;
end $$;
drop trigger if exists notify_event_moderation_trg on public.events;
create trigger notify_event_moderation_trg after update of status on public.events
  for each row execute function public.notify_event_moderation();
