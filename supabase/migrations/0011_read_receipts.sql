-- =====================================================================
-- Vibely — Live read receipts (0011)
-- The conversation_members.last_read_at column and the self-update RLS
-- policy already exist (0001 + 0004), and the thread already writes
-- last_read_at when a member opens a chat. This migration only makes the
-- "Seen" status update LIVE: it streams conversation_members changes over
-- Supabase Realtime so a sender sees the receipt flip to "Seen" the moment
-- the recipient opens the conversation.
--   1. add public.conversation_members to the supabase_realtime publication
--   2. replica identity full, so UPDATE payloads carry every column and the
--      member-only RLS filter can be evaluated on the realtime stream
-- No table/column changes. Run in the Supabase SQL Editor after 0010_nudges.sql.
-- =====================================================================

-- 1. Stream membership changes (last_read_at) live to conversation members
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'conversation_members'
  ) then
    alter publication supabase_realtime add table public.conversation_members;
  end if;
end $$;

-- 2. Full row image so Realtime can evaluate member-only RLS on updates
alter table public.conversation_members replica identity full;
