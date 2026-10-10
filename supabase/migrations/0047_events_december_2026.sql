-- =====================================================================
-- 0047_events_december_2026.sql
--
-- The seeded events had drifted into the past, and the Events page hides
-- anything that started more than an hour ago, so the rails went empty.
-- This pins every seeded event to a fixed date in December 2026 (local
-- Africa/Nairobi time, +03:00) so they show again until the end of the year.
--
-- Only the seeded rows (by id) are touched; member-created events are not.
-- Ids that no longer exist are simply skipped. Safe to run more than once.
-- Run in the Supabase SQL editor after 0046.
-- =====================================================================

update public.events set starts_at = '2026-12-05 17:00:00+03', ends_at = '2026-12-05 23:00:00+03'
 where id = 'e7e10001-0000-4000-8000-000000000001';  -- Sundowner, Sat 05 Dec 17:00-23:00

update public.events set starts_at = '2026-12-06 05:30:00+03', ends_at = '2026-12-06 11:00:00+03'
 where id = 'e7e10002-0000-4000-8000-000000000002';  -- Ngong hike, Sun 06 Dec 05:30-11:00

update public.events set starts_at = '2026-12-12 11:00:00+03', ends_at = '2026-12-12 15:00:00+03'
 where id = 'e7e10003-0000-4000-8000-000000000003';  -- Brunch, Sat 12 Dec 11:00-15:00

update public.events set starts_at = '2026-12-13 08:00:00+03', ends_at = '2026-12-13 14:00:00+03'
 where id = 'e7e10004-0000-4000-8000-000000000004';  -- Diani dive, Sun 13 Dec 08:00-14:00

update public.events set starts_at = '2026-12-18 18:00:00+03', ends_at = '2026-12-18 22:00:00+03'
 where id = 'e7e10005-0000-4000-8000-000000000005';  -- Kisumu acoustic, Fri 18 Dec 18:00-22:00

update public.events set starts_at = '2026-12-19 06:30:00+03', ends_at = '2026-12-19 09:00:00+03'
 where id = 'e7e10006-0000-4000-8000-000000000006';  -- Park run, Sat 19 Dec 06:30-09:00

update public.events set starts_at = '2026-12-20 16:00:00+03', ends_at = '2026-12-20 20:00:00+03'
 where id = 'e7e10007-0000-4000-8000-000000000007';  -- Old Town food walk, Sun 20 Dec 16:00-20:00

update public.events set starts_at = '2026-12-11 17:30:00+03', ends_at = '2026-12-11 20:00:00+03'
 where id = 'e7e10008-0000-4000-8000-000000000008';  -- Creatives meetup, Fri 11 Dec 17:30-20:00

-- Earlier demo events from 0021 (if still present).
update public.events set starts_at = '2026-12-04 18:00:00+03', ends_at = '2026-12-04 22:00:00+03'
 where id = 'e0000001-0000-4000-8000-000000000001';  -- Fri 04 Dec 18:00-22:00

update public.events set starts_at = '2026-12-07 18:00:00+03', ends_at = '2026-12-07 21:00:00+03'
 where id = 'e0000002-0000-4000-8000-000000000002';  -- Mon 07 Dec 18:00-21:00

update public.events set starts_at = '2026-12-14 18:00:00+03', ends_at = '2026-12-14 21:00:00+03'
 where id = 'e0000003-0000-4000-8000-000000000003';  -- Mon 14 Dec 18:00-21:00

update public.events set starts_at = '2026-12-21 18:00:00+03', ends_at = '2026-12-21 21:00:00+03'
 where id = 'e0000004-0000-4000-8000-000000000004';  -- Mon 21 Dec 18:00-21:00

update public.events set starts_at = '2026-12-26 14:00:00+03', ends_at = '2026-12-26 20:00:00+03'
 where id = 'e0000005-0000-4000-8000-000000000005';  -- Sat 26 Dec 14:00-20:00

update public.events set starts_at = '2026-12-27 10:00:00+03', ends_at = '2026-12-27 14:00:00+03'
 where id = 'e0000006-0000-4000-8000-000000000006';  -- Sun 27 Dec 10:00-14:00

-- Verify: all seeded events in December, none in the past.
--   select title, to_char(starts_at at time zone 'Africa/Nairobi', 'Dy DD Mon HH24:MI')
--     from public.events order by starts_at;
--   select count(*) from public.events where starts_at < now() and status = 'published';
