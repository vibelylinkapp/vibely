-- =====================================================================
-- Vibely - New-follower notification (20260801_follow_notify)
-- Adds a "started following you" entry to the notifications inbox when a
-- member follows another. Mirrors the SECURITY DEFINER trigger pattern in
-- 0025_notifications.sql: the notifications table has no member insert policy,
-- so rows are written only by definer triggers like this one. The table is
-- already in the supabase_realtime publication, so the nav bell updates live.
-- Requires 20260801_follows.sql (the follows table) and 0025_notifications.sql.
-- Run in the Supabase SQL Editor.
-- =====================================================================

-- ---- new follow -> notify the followed member ----------------------
create or replace function public.notify_follow()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Self-follows are blocked by a check constraint, but guard anyway.
  if new.following_id is not null and new.following_id <> new.follower_id then
    insert into public.notifications(recipient_id, actor_id, type, entity_type, entity_id, link)
    values (new.following_id, new.follower_id, 'follow', 'profile', new.follower_id, '/u/' || new.follower_id);
  end if;
  return new;
end $$;

-- A duplicate follow errors on the (follower_id, following_id) PK before this
-- AFTER INSERT trigger fires, so re-following never creates a second row.
drop trigger if exists notify_follow_trg on public.follows;
create trigger notify_follow_trg after insert on public.follows
  for each row execute function public.notify_follow();
