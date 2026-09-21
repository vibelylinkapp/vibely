-- =====================================================================
-- 0041_fix_event_times.sql
--
-- Events were showing 02:49 starts. 0039 built each timestamp as
--     now() + interval '3 days' + interval '17 hours'
-- which adds 17 hours to the CURRENT CLOCK TIME rather than setting the
-- time of day. Run at 09:49, that lands at 02:49 two nights later.
--
-- This sets each event to a sensible local time by truncating to the
-- start of the day in Africa/Nairobi first, then adding the offset:
--     date_trunc('day', now() at time zone 'Africa/Nairobi')
--       + interval 'N days' + interval 'H hours'
-- and converting back to timestamptz.
--
-- Times are still relative, so the events never drift into the past.
--
-- Safe to run more than once. Run after 0040.
-- =====================================================================

create or replace function public._ke_at(days int, hours numeric)
returns timestamptz
language sql
immutable
as $$
  select ((date_trunc('day', (now() at time zone 'Africa/Nairobi'))
           + make_interval(days => days)
           + make_interval(mins => (hours * 60)::int))
          at time zone 'Africa/Nairobi');
$$;

update public.events set starts_at = public._ke_at(3, 17),    ends_at = public._ke_at(3, 23)
 where id = 'e7e10001-0000-4000-8000-000000000001';  -- Sundowner, 5pm-11pm

update public.events set starts_at = public._ke_at(5, 5.5),   ends_at = public._ke_at(5, 11)
 where id = 'e7e10002-0000-4000-8000-000000000002';  -- Ngong hike, 5:30am-11am

update public.events set starts_at = public._ke_at(6, 11),    ends_at = public._ke_at(6, 15)
 where id = 'e7e10003-0000-4000-8000-000000000003';  -- Brunch, 11am-3pm

update public.events set starts_at = public._ke_at(9, 8),     ends_at = public._ke_at(9, 14)
 where id = 'e7e10004-0000-4000-8000-000000000004';  -- Diani dive, 8am-2pm

update public.events set starts_at = public._ke_at(11, 18),   ends_at = public._ke_at(11, 22)
 where id = 'e7e10005-0000-4000-8000-000000000005';  -- Kisumu acoustic, 6pm-10pm

update public.events set starts_at = public._ke_at(13, 6.5),  ends_at = public._ke_at(13, 9)
 where id = 'e7e10006-0000-4000-8000-000000000006';  -- Park run, 6:30am-9am

update public.events set starts_at = public._ke_at(16, 16),   ends_at = public._ke_at(16, 20)
 where id = 'e7e10007-0000-4000-8000-000000000007';  -- Old Town food walk, 4pm-8pm

update public.events set starts_at = public._ke_at(18, 17.5), ends_at = public._ke_at(18, 20)
 where id = 'e7e10008-0000-4000-8000-000000000008';  -- Creatives meetup, 5:30pm-8pm

drop function public._ke_at(int, numeric);

-- Verify: every start should be a believable hour, none in the past.
--   select title,
--          to_char(starts_at at time zone 'Africa/Nairobi', 'Dy DD Mon HH24:MI') as starts_eat
--     from public.events order by starts_at;
--   select count(*) from public.events where starts_at < now();  -- expect 0
