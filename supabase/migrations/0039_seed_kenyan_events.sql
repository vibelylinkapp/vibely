-- =====================================================================
-- 0039_seed_kenyan_events.sql
--
-- The Events tab is empty: purge_demo_content() removed all six seeded
-- events and nothing replaced them, so the screen renders its empty
-- state permanently.
--
-- Eight events across the country, matching the member spread from
-- 0035/0037 rather than sitting entirely in Nairobi.
--
-- DATES ARE RELATIVE (now() + interval), not fixed timestamps. The
-- previous seed hard-coded dates, so the events fell into the past and
-- silently vanished from the rails, which filter on starts_at >= now().
-- These stay in the future no matter when the migration is run.
--
-- SAFETY:
--   created_by is NULL and is_demo is true, which is exactly what
--   purge_demo_content() deletes directly (seeded events have no author
--   to cascade from). One call removes all eight:
--
--       select public.purge_demo_content();
--
--   Fixed UUIDs + ON CONFLICT DO NOTHING, so re-running is harmless.
--
-- Run in the Supabase SQL Editor after 0038.
-- =====================================================================

insert into public.events (
  id, created_by, title, description, category, venue, area, city, country,
  image_url, starts_at, ends_at, price_kes, capacity, host_name,
  going_base, is_trending, status, is_demo
) values
  ('e7e10001-0000-4000-8000-000000000001', null,
   'Sundowner Sessions at the Rooftop',
   'Live afro-house until late, city skyline, and a very good grill. Come early for the sunset.',
   'nightlife', 'Alchemist Bar', 'Westlands', 'Nairobi', 'Kenya',
   'https://picsum.photos/seed/vibely-ev-rooftop/1000/600',
   now() + interval '3 days'  + interval '17 hours',
   now() + interval '3 days'  + interval '23 hours',
   1000, 200, 'Alchemist', 84, true, 'published', true),

  ('e7e10002-0000-4000-8000-000000000002', null,
   'Ngong Hills Sunrise Hike',
   'Seven kilometres along the ridge, starting before dawn. Transport from town included.',
   'outdoors', 'Ngong Hills', 'Ngong', 'Nairobi', 'Kenya',
   'https://picsum.photos/seed/vibely-ev-ngong/1000/600',
   now() + interval '5 days'  + interval '5 hours',
   now() + interval '5 days'  + interval '11 hours',
   1500, 40, 'Nairobi Hikers', 31, true, 'published', true),

  ('e7e10003-0000-4000-8000-000000000003', null,
   'Saturday Brunch & Vinyl',
   'Slow brunch, old records, no rush. Bring a friend or arrive alone and leave with one.',
   'food', 'About Thyme', 'Kilimani', 'Nairobi', 'Kenya',
   'https://picsum.photos/seed/vibely-ev-brunch/1000/600',
   now() + interval '6 days'  + interval '11 hours',
   now() + interval '6 days'  + interval '15 hours',
   2500, 60, 'About Thyme', 22, false, 'published', true),

  ('e7e10004-0000-4000-8000-000000000004', null,
   'Diani Reef Dive Day',
   'Two guided dives on the south coast reef. Beginners welcome, gear provided.',
   'outdoors', 'Diani Marine', 'Diani', 'Kwale', 'Kenya',
   'https://picsum.photos/seed/vibely-ev-diani/1000/600',
   now() + interval '9 days'  + interval '8 hours',
   now() + interval '9 days'  + interval '14 hours',
   6500, 16, 'Diani Marine', 11, true, 'published', true),

  ('e7e10005-0000-4000-8000-000000000005', null,
   'Kisumu Lakeside Acoustic Night',
   'Benga and acoustic sets by the water, with street food from the pier vendors.',
   'music', 'Dunga Beach', 'Dunga', 'Kisumu', 'Kenya',
   'https://picsum.photos/seed/vibely-ev-kisumu/1000/600',
   now() + interval '11 days' + interval '18 hours',
   now() + interval '11 days' + interval '22 hours',
   500, 150, 'Dunga Sessions', 46, false, 'published', true),

  ('e7e10006-0000-4000-8000-000000000006', null,
   'Nairobi 10K Park Run',
   'Two loops of the park, all paces welcome. Coffee and samosas at the finish.',
   'sports', 'Karura Forest', 'Karura', 'Nairobi', 'Kenya',
   'https://picsum.photos/seed/vibely-ev-10k/1000/600',
   now() + interval '13 days' + interval '6 hours',
   now() + interval '13 days' + interval '9 hours',
   0, 300, 'Karura Runners', 128, false, 'published', true),

  ('e7e10007-0000-4000-8000-000000000007', null,
   'Old Town Food Walk',
   'Six stops through Mombasa Old Town: biryani, mishkaki, kaimati and spiced coffee.',
   'food', 'Mombasa Old Town', 'Old Town', 'Mombasa', 'Kenya',
   'https://picsum.photos/seed/vibely-ev-oldtown/1000/600',
   now() + interval '16 days' + interval '16 hours',
   now() + interval '16 days' + interval '20 hours',
   3000, 25, 'Coast Food Walks', 19, false, 'published', true),

  ('e7e10008-0000-4000-8000-000000000008', null,
   'Creatives Meetup: Portfolio Night',
   'Designers, photographers and writers share work in progress. Five minutes each, no slides required.',
   'networking', 'Ikigai Lavington', 'Lavington', 'Nairobi', 'Kenya',
   'https://picsum.photos/seed/vibely-ev-creatives/1000/600',
   now() + interval '18 days' + interval '17 hours',
   now() + interval '18 days' + interval '20 hours',
   800, 50, 'Ikigai', 37, false, 'published', true)
on conflict (id) do nothing;

-- Verify:
--   select count(*) from public.events where is_demo;                  -- expect 8
--   select count(*) from public.events where starts_at >= now();       -- expect 8
--   select title, city, starts_at, is_trending
--     from public.events order by starts_at;
