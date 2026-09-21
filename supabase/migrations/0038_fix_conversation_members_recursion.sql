-- =====================================================================
-- 0038_fix_conversation_members_recursion.sql
--
-- Fixes: opening any chat returns 404, and messages cannot be read.
--
-- WHAT WENT WRONG:
--   0001_init.sql:326 defines
--
--     create policy cmembers_read on public.conversation_members
--       for select using (
--         exists (select 1 from public.conversation_members m2
--                  where m2.conversation_id = conversation_members.conversation_id
--                    and m2.profile_id = auth.uid()));
--
--   The SELECT policy on conversation_members queries
--   conversation_members. Evaluating the policy re-triggers the policy,
--   so Postgres raises 42P17 "infinite recursion detected in policy for
--   relation conversation_members".
--
--   start_conversation() is SECURITY DEFINER, so it bypasses RLS and
--   creates the conversation and both member rows successfully. The
--   client then navigates to /messages/<id>, whose first query is the
--   membership lookup. That query hits the recursion, returns null, and
--   the page calls notFound() -- producing a 404 for a conversation
--   that genuinely exists.
--
--   The same recursion propagates to convo_read, messages_read and
--   messages_send, because each of those subqueries conversation_members
--   and therefore triggers this policy too.
--
-- THE FIX:
--   A SECURITY DEFINER helper performs the membership test with RLS
--   suspended, so the policy no longer re-enters the table it guards.
--   This is the standard remedy for self-referential RLS.
--
--   Visibility is unchanged: you may read the member rows of any
--   conversation you belong to, and no others.
--
-- Run in the Supabase SQL Editor after 0037.
-- =====================================================================

create or replace function public.is_conversation_member(cid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
      from public.conversation_members
     where conversation_id = cid
       and profile_id = auth.uid()
  );
$$;

revoke all on function public.is_conversation_member(uuid) from public, anon;
grant execute on function public.is_conversation_member(uuid) to authenticated;

-- Replace the recursive policy.
drop policy if exists cmembers_read on public.conversation_members;
create policy cmembers_read on public.conversation_members
  for select
  using (
    -- your own membership row: answerable without touching the table
    profile_id = auth.uid()
    -- other members of a conversation you belong to: via the helper
    or public.is_conversation_member(conversation_id)
  );

-- The remaining policies subquery conversation_members, which is what
-- dragged them into the same recursion. Route them through the helper.
drop policy if exists convo_read on public.conversations;
create policy convo_read on public.conversations
  for select using (public.is_conversation_member(id));

drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages
  for select using (public.is_conversation_member(conversation_id));

drop policy if exists messages_send on public.messages;
create policy messages_send on public.messages
  for insert with check (
    sender_id = auth.uid()
    and public.is_conversation_member(conversation_id)
  );

-- Verify: as a signed-in member, this must return a row rather than
-- raising 42P17.
--
--   select conversation_id from public.conversation_members
--    where profile_id = auth.uid() limit 1;
