-- =====================================================================
-- 0040_kenyan_event_photos.sql
--
-- 0039 seeded the events with picsum.photos placeholder covers, which
-- return generic stock imagery with no connection to Kenya. This points
-- each event at a purpose-made photograph matching its actual listing:
-- the right city, the right activity, Kenyan people.
--
-- Same approach as the member portraits in 0036: images are generated
-- rather than taken from stock libraries, and are served from the app's
-- own origin out of public/seed/events/ so there is no dependency on an
-- external image host that can rate-limit or disappear.
--
-- Run AFTER the deploy containing public/seed/events/, otherwise the
-- covers will 404. Requires 0039 to have been run first, since these
-- are updates to the rows it created.
--
-- Safe to run more than once.
-- =====================================================================

update public.events set image_url = '/seed/events/rooftop.jpg'
 where id = 'e7e10001-0000-4000-8000-000000000001';  -- Sundowner Sessions, Westlands

update public.events set image_url = '/seed/events/ngong.jpg'
 where id = 'e7e10002-0000-4000-8000-000000000002';  -- Ngong Hills Sunrise Hike

update public.events set image_url = '/seed/events/brunch.jpg'
 where id = 'e7e10003-0000-4000-8000-000000000003';  -- Saturday Brunch & Vinyl, Kilimani

update public.events set image_url = '/seed/events/diani.jpg'
 where id = 'e7e10004-0000-4000-8000-000000000004';  -- Diani Reef Dive Day

update public.events set image_url = '/seed/events/kisumu.jpg'
 where id = 'e7e10005-0000-4000-8000-000000000005';  -- Kisumu Lakeside Acoustic Night

update public.events set image_url = '/seed/events/parkrun.jpg'
 where id = 'e7e10006-0000-4000-8000-000000000006';  -- Nairobi 10K Park Run, Karura

update public.events set image_url = '/seed/events/oldtown.jpg'
 where id = 'e7e10007-0000-4000-8000-000000000007';  -- Old Town Food Walk, Mombasa

update public.events set image_url = '/seed/events/creatives.jpg'
 where id = 'e7e10008-0000-4000-8000-000000000008';  -- Creatives Meetup, Lavington

-- Verify:
--   select count(*) from public.events where image_url like '%picsum%';    -- expect 0
--   select count(*) from public.events where image_url like '/seed/%';     -- expect 8
--   select title, city, image_url from public.events order by starts_at;
