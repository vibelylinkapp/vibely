-- =====================================================================
-- Vibely — Likes / matching (0005)
-- The likes table + matches view already exist (0001). This migration:
--   1. hardens the matches view to respect RLS (security_invoker)
--   2. gates NEW conversations to mutual matches (existing chats still open)
-- Run in the Supabase SQL Editor after 0004_messaging.sql.
-- =====================================================================

-- 1. Make the matches view run with the querying user's permissions, so it
--    only ever exposes matches the current user is part of (respects likes RLS).
alter view public.matches set (security_invoker = on);

-- 2. Only let people open a fresh chat once they have matched (mutual like).
--    An already-existing conversation is still returned (so older chats work).
create or replace function public.start_conversation(other_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me    uuid := auth.uid();
  convo uuid;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  if other_id is null or other_id = me then
    raise exception 'Invalid recipient';
  end if;
  if not exists (select 1 from public.profiles where id = other_id) then
    raise exception 'Recipient not found';
  end if;
  if exists (
    select 1 from public.blocks
    where (blocker_id = me and blocked_id = other_id)
       or (blocker_id = other_id and blocked_id = me)
  ) then
    raise exception 'Cannot message this user';
  end if;

  -- reuse an existing 1:1 conversation the two of us already share
  select cm1.conversation_id into convo
  from public.conversation_members cm1
  join public.conversation_members cm2
    on cm1.conversation_id = cm2.conversation_id
  where cm1.profile_id = me and cm2.profile_id = other_id
  limit 1;

  if convo is not null then
    return convo;
  end if;

  -- require a mutual like (match) before starting a brand-new chat
  if not exists (
    select 1
    from public.likes l1
    join public.likes l2
      on l1.liker_id = l2.liked_id and l1.liked_id = l2.liker_id
    where l1.liker_id = me and l1.liked_id = other_id
  ) then
    raise exception 'You can only message people you have matched with';
  end if;

  insert into public.conversations default values returning id into convo;
  insert into public.conversation_members (conversation_id, profile_id)
  values (convo, me), (convo, other_id);

  return convo;
end $$;

grant execute on function public.start_conversation(uuid) to authenticated;
