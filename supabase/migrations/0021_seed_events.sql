-- =====================================================================
-- Vibely - Seed trending events (0021)
-- Six curated demo events spread across Kenya + East Africa (Nairobi,
-- Mombasa, Kampala, Kigali) so Trending is populated on launch and the
-- product reads as a regional app, not a Nairobi-only one. Idempotent via
-- fixed UUIDs + ON CONFLICT DO NOTHING. created_by is left NULL (Vibely
-- Events house account); host_name carries the display host.
-- Run in the Supabase SQL Editor after 0020_events.sql.
-- Teardown at the very bottom.
-- =====================================================================

insert into public.events
  (id, created_by, title, description, category, venue, area, city, country,
   geo, image_url, starts_at, ends_at, price_kes, capacity, host_name,
   going_base, is_trending, status)
values
  ('e0000001-0000-4000-8000-000000000001', null,
   'Sarabi Rooftop Sundowner',
   'Nairobi''s favourite Saturday rooftop is back. Sunset views over the city, a live DJ, a karaoke corner, and a crowd that is here to actually meet people. Come solo or bring the crew - we run icebreaker tables for first-timers.',
   'Nightlife', 'Sarova Stanley Rooftop', 'CBD', 'Nairobi', 'Kenya',
   st_setsrid(st_makepoint(36.8172, -1.2864), 4326)::geography,
   'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800&q=70',
   '2026-08-01 17:00:00+03', '2026-08-01 23:30:00+03', 1500, 200, 'Vibely Events',
   128, true, 'published'),

  ('e0000002-0000-4000-8000-000000000002', null,
   'Alchemist Live Band Night',
   'Westlands'' legendary courtyard hosts a full live band plus resident DJs after. Food trucks, an open dance floor, and Vibely tables for anyone rolling solo.',
   'Music', 'The Alchemist Bar', 'Westlands', 'Nairobi', 'Kenya',
   st_setsrid(st_makepoint(36.8038, -1.2649), 4326)::geography,
   'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=70',
   '2026-08-07 20:00:00+03', '2026-08-08 01:00:00+03', 1000, 400, 'Vibely Events',
   210, true, 'published'),

  ('e0000003-0000-4000-8000-000000000003', null,
   'Ngong Hills Sunrise Hike',
   'Beat the crowds and the heat. We meet at dawn, hike the ridge for sunrise over the Rift Valley, and grab breakfast after. Beginner friendly, guided, free to join.',
   'Outdoors', 'Ngong Hills Main Gate', 'Ngong', 'Kajiado', 'Kenya',
   st_setsrid(st_makepoint(36.6333, -1.4000), 4326)::geography,
   'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=70',
   '2026-08-08 06:00:00+03', '2026-08-08 10:00:00+03', 0, 60, 'Vibely Outdoors',
   42, true, 'published'),

  ('e0000004-0000-4000-8000-000000000004', null,
   'Nyali Beach Bonfire & Drum Circle',
   'Coastal nights done right - a bonfire on Nyali beach, live drummers, and a barefoot crowd. Perfect for meeting people while the tide comes in.',
   'Beach', 'Nyali Beach', 'Nyali', 'Mombasa', 'Kenya',
   st_setsrid(st_makepoint(39.7000, -4.0300), 4326)::geography,
   'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=70',
   '2026-08-15 18:30:00+03', '2026-08-15 23:00:00+03', 800, 150, 'Vibely Coast',
   76, true, 'published'),

  ('e0000005-0000-4000-8000-000000000005', null,
   'Kampala Rooftop Networking Mixer',
   'Founders, creatives and professionals across Kampala meet over sundowners. Structured intros for the first hour, open mingling after. Free entry.',
   'Networking', 'Skyz Hotel Rooftop', 'Naguru', 'Kampala', 'Uganda',
   st_setsrid(st_makepoint(32.5825, 0.3476), 4326)::geography,
   'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=70',
   '2026-08-13 18:00:00+03', '2026-08-13 22:00:00+03', 0, 120, 'Vibely EA',
   54, false, 'published'),

  ('e0000006-0000-4000-8000-000000000006', null,
   'Kigali Jazz & Wine Night',
   'An intimate evening of live jazz and Rwandan wines in the hills of Kigali. Small room, big vibes, easy conversation.',
   'Music', 'The Retreat', 'Nyarutarama', 'Kigali', 'Rwanda',
   st_setsrid(st_makepoint(30.0619, -1.9403), 4326)::geography,
   'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=70',
   '2026-08-16 19:00:00+03', '2026-08-16 23:00:00+03', 1200, 80, 'Vibely EA',
   63, true, 'published')
on conflict (id) do nothing;

-- =====================================================================
-- TEARDOWN (run to remove the demo events before/at launch):
-- delete from public.events where host_name in
--   ('Vibely Events','Vibely Outdoors','Vibely Coast','Vibely EA')
--   and created_by is null;
-- =====================================================================
