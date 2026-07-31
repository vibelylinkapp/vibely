-- =====================================================================
-- Vibely — Private chat media (0012)
-- Chat photos previously reused the PUBLIC "avatars" bucket, so their URLs
-- were unguessable but not access-controlled. This adds a PRIVATE
-- "chat-media" bucket whose objects are readable/writable only by members
-- of the conversation the file belongs to. Clients view files through
-- short-lived signed URLs. Also accepts audio so voice notes (0-duration
-- feature) can share the same bucket.
--
-- Object key layout:  <conversation_id>/<uploader_uid>/<uuid>.<ext>
--   folder[1] = conversation_id, folder[2] = uploader uid
--
-- Run in the Supabase SQL Editor after 0011_read_receipts.sql.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-media', 'chat-media', false, 10485760,
        array['image/jpeg','image/png','image/webp','image/gif',
              'audio/webm','audio/mp4','audio/mpeg','audio/ogg','audio/wav'])
on conflict (id) do update
  set public = false,
      file_size_limit = 10485760,
      allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif',
              'audio/webm','audio/mp4','audio/mpeg','audio/ogg','audio/wav'];

-- Read: only members of the conversation named by the first path segment.
drop policy if exists "chat_media_select_members" on storage.objects;
create policy "chat_media_select_members"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'chat-media'
    and exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id::text = (storage.foldername(name))[1]
        and cm.profile_id = auth.uid()
    )
  );

-- Write: members only, and only inside their own <cid>/<uid>/ subfolder.
drop policy if exists "chat_media_insert_members" on storage.objects;
create policy "chat_media_insert_members"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'chat-media'
    and (storage.foldername(name))[2] = auth.uid()::text
    and exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id::text = (storage.foldername(name))[1]
        and cm.profile_id = auth.uid()
    )
  );

-- Delete: only your own uploads.
drop policy if exists "chat_media_delete_own" on storage.objects;
create policy "chat_media_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'chat-media'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
