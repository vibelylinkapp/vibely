-- =====================================================================
-- Vibely — Messaging enablement (0004)
-- The conversations / conversation_members / messages tables and their
-- member-only RLS already exist (0001). This migration adds the three
-- things needed to actually chat:
--   1. members can update their OWN membership row (read receipts)
--   2. a secure start_conversation(other_id) RPC to open/reuse a 1:1 chat
--      (there is intentionally no client INSERT policy on those tables)
--   3. Realtime on public.messages so new messages stream live
-- Run in the Supabase SQL Editor after 0003_storage.sql.
-- =====================================================================

-- 1. Let a member update ONLY their own membership row (for last_read_at)
drop policy if exists cmembers_update_self on public.conversation_members;
create policy cmembers_update_self on public.conversation_members
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- 2. Open (or reuse) a 1:1 conversation between the caller and other_id.
--    SECURITY DEFINER so it can create the conversation + member rows,
--    while enforcing auth + block checks itself.
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

  insert into public.conversations default values returning id into convo;
  insert into public.conversation_members (conversation_id, profile_id)
  values (convo, me), (convo, other_id);

  return convo;
end $$;

grant execute on function public.start_conversation(uuid) to authenticated;

-- 3. Stream new messages live to members via Supabase Realtime
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
