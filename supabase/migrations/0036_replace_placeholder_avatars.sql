-- =====================================================================
-- 0036_replace_placeholder_avatars.sql
--
-- The five existing accounts still carried randomuser.me portraits from
-- the original placeholder seed. Those faces are almost entirely white,
-- which is wrong for a Nairobi-based app, and Peter had no avatar at all
-- so his card rendered a bare "P" initial.
--
-- 0035 only ADDED new sample members; it did not touch rows that already
-- existed, so the placeholder faces stayed on screen. This fixes those.
--
-- The images ship in public/seed/ and are served from the app's own
-- origin, so run this AFTER the deploy that contains them, otherwise the
-- avatars will 404.
--
-- These are real accounts, not demo data: nothing here is tagged is_demo
-- and purge_demo_content() will not touch them. Any member can still
-- overwrite their own photo from Profile > Edit at any time.
--
-- Run in the Supabase SQL Editor after 0035.
-- =====================================================================

update public.profiles set avatar_url = '/seed/nadia_h.jpg'
 where id = 'f9236f01-55b5-4184-956e-bd8566eeddd1';   -- Nadia Hassan

update public.profiles set avatar_url = '/seed/red_ant.jpg'
 where id = '4035a1a6-6ab4-4ba0-95ab-654db8a39419';   -- Red Ant

update public.profiles set avatar_url = '/seed/vibesmose.jpg'
 where id = '8625814a-ab47-4059-b2bf-ad32620cfe09';   -- vibesmose

update public.profiles set avatar_url = '/seed/moselanto.jpg'
 where id = '9d44fd10-e3bb-43b9-b466-1644ea59ba94';   -- moselanto

-- Peter had avatar_url = null, which is why his card showed the initial.
update public.profiles set avatar_url = '/seed/peter.jpg'
 where id = 'e5692404-dbf1-4c4a-8b84-d34a2089f7ff';   -- Peter

-- Verify: every profile should now have an avatar, and none should still
-- point at randomuser.me.
--
--   select display_name, avatar_url from public.profiles order by created_at;
--   select count(*) from public.profiles where avatar_url is null;                    -- expect 0
--   select count(*) from public.profiles where avatar_url like '%randomuser%';        -- expect 0
