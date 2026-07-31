-- =====================================================================
-- Vibely — Message reactions (0013)
-- Emoji reactions on chat messages. One row per (message, member, emoji);
-- reacting again with the same emoji is a toggle-off (delete). Read + write
-- are limited to members of the message's conversation, and reactions stream
-- live to those members over Supabase Realtime.
-- Run in the Supabase SQL Editor after 0012_chat_media.sql.
-- =====================================================================
create table if not exists public.message_reactions (
  message_id  uuid not null references public.messages(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  emoji       text not null,
  created_at  timestamptz not null default now(),
  primary key (message_id, profile_id, emoji)
);
create index if not exists message_reactions_message_idx
  on public.message_reactions (message_id);

alter table public.message_reactions enable row level security;

-- Read: any member of the conversation the message belongs to.
drop policy if exists mreactions_select_members on public.message_reactions;
create policy mreactions_select_members on public.message_reactions
  for select using (
    exists (
      select 1
      from public.messages m
      join public.conversation_members cm
        on cm.conversation_id = m.conversation_id
      where m.id = message_reactions.message_id
        and cm.profile_id = auth.uid()
    )
  );

-- Insert: only as yourself, and only on messages in your conversations.
drop policy if exists mreactions_insert_self on public.message_reactions;
create policy mreactions_insert_self on public.message_reactions
  for insert with check (
    profile_id = auth.uid()
    and exists (
      select 1
      from public.messages m
      join public.conversation_members cm
        on cm.conversation_id = m.conversation_id
      where m.id = message_reactions.message_id
        and cm.profile_id = auth.uid()
    )
  );

-- Delete: only your own reactions.
drop policy if exists mreactions_delete_self on public.message_reactions;
create policy mreactions_delete_self on public.message_reactions
  for delete using (profile_id = auth.uid());

-- Stream reaction inserts/deletes live to conversation members.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'message_reactions'
  ) then
    alter publication supabase_realtime add table public.message_reactions;
  end if;
end $$;

-- Full row image so DELETE payloads carry the emoji/profile for RLS + client.
alter table public.message_reactions replica identity full;
