-- =====================================================================
-- Vibely - Seed demo stories (0026)
-- The Home stories rail looked empty (only "Your story / Add") because none
-- of the demo people had posted a story. This seeds a story for five of the
-- 0017 demo members so a newcomer immediately sees active faces to tap.
--
-- Safe + idempotent:
--   * Fixed story ids + ON CONFLICT (id) DO NOTHING -> re-running is a no-op.
--   * INSERT ... SELECT ... JOIN profiles -> only seeds people that actually
--     exist, so it never FK-fails if 0017 has not been applied yet.
--   * Long expiry (10 years) so the demo stays populated (real stories still
--     expire in 24h via the table default).
-- Run in the Supabase SQL Editor after 0025. Best after 0017 + 0023 so the
-- avatars/media are the verified Nairobi portraits.
-- =====================================================================

insert into public.stories (id, profile_id, media_url, caption, mood, is_approved, expires_at)
select
  v.sid,
  v.pid,
  v.media,
  v.caption,
  v.mood,
  true,
  now() + interval '3650 days'
from (values
  ('b0000001-0000-4000-8000-000000000001'::uuid, 'a0000001-0000-4000-8000-000000000001'::uuid,
   'https://images.pexels.com/photos/20255716/pexels-photo-20255716.jpeg?auto=compress&cs=tinysrgb&w=700&h=1000&fit=crop',
   'Sundowners in Kilimani', 'Out tonight'),
  ('b0000002-0000-4000-8000-000000000002'::uuid, 'a0000002-0000-4000-8000-000000000002'::uuid,
   'https://images.pexels.com/photos/34592823/pexels-photo-34592823.jpeg?auto=compress&cs=tinysrgb&w=700&h=1000&fit=crop',
   'Live band night in Westlands', 'Vibing'),
  ('b0000003-0000-4000-8000-000000000003'::uuid, 'a0000003-0000-4000-8000-000000000003'::uuid,
   'https://images.pexels.com/photos/15020799/pexels-photo-15020799.jpeg?auto=compress&cs=tinysrgb&w=700&h=1000&fit=crop',
   'Slow brunch in Lavington', 'Chilled'),
  ('b0000004-0000-4000-8000-000000000004'::uuid, 'a0000004-0000-4000-8000-000000000004'::uuid,
   'https://images.pexels.com/photos/12455720/pexels-photo-12455720.jpeg?auto=compress&cs=tinysrgb&w=700&h=1000&fit=crop',
   'Morning trail out in Karen', 'Active'),
  ('b0000005-0000-4000-8000-000000000005'::uuid, 'a0000005-0000-4000-8000-000000000005'::uuid,
   'https://images.pexels.com/photos/32707142/pexels-photo-32707142.jpeg?auto=compress&cs=tinysrgb&w=700&h=1000&fit=crop',
   'Match day with the crew', 'Hyped')
) as v(sid, pid, media, caption, mood)
join public.profiles p on p.id = v.pid
on conflict (id) do nothing;
