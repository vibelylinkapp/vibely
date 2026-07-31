-- =====================================================================
-- Vibely - Fix demo imagery (0023)
-- Vibely is a Nairobi / Kenya app, so the demo members must look like real
-- Nairobians. This replaces the placeholder (non-representative) avatars with
-- verified photos of Black / Kenyan people and spreads the demo people across
-- a wider set of Nairobi neighbourhoods (adds Kayole, Utawala, Thika).
--
-- Safe + idempotent: it only UPDATEs the known 0017 seed profile ids, so it
-- works whether or not 0017 has already been applied. Must run AFTER 0017
-- (numeric order handles this). Run in the Supabase SQL Editor after 0022.
-- =====================================================================

update public.profiles as p set
  avatar_url = v.avatar,
  area       = v.area,
  geo        = st_setsrid(st_makepoint(v.lng, v.lat), 4326)::geography
from (values
  ('a0000001-0000-4000-8000-000000000001'::uuid, 'https://images.pexels.com/photos/20255716/pexels-photo-20255716.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&fit=crop', 'Kilimani',  -1.2907::float8, 36.7869::float8),
  ('a0000002-0000-4000-8000-000000000002'::uuid, 'https://images.pexels.com/photos/34592823/pexels-photo-34592823.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&fit=crop', 'Westlands', -1.2649,        36.8038),
  ('a0000003-0000-4000-8000-000000000003'::uuid, 'https://images.pexels.com/photos/15020799/pexels-photo-15020799.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&fit=crop', 'Lavington', -1.2795,        36.7666),
  ('a0000004-0000-4000-8000-000000000004'::uuid, 'https://images.pexels.com/photos/12455720/pexels-photo-12455720.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&fit=crop', 'Karen',     -1.3197,        36.7085),
  ('a0000005-0000-4000-8000-000000000005'::uuid, 'https://images.pexels.com/photos/32707142/pexels-photo-32707142.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&fit=crop', 'Kayole',    -1.2760,        36.9130),
  ('a0000006-0000-4000-8000-000000000006'::uuid, 'https://images.pexels.com/photos/7562179/pexels-photo-7562179.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&fit=crop',  'Utawala',   -1.2833,        36.9667),
  ('a0000007-0000-4000-8000-000000000007'::uuid, 'https://images.pexels.com/photos/30796836/pexels-photo-30796836.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&fit=crop', 'Langata',   -1.3520,        36.7420),
  ('a0000008-0000-4000-8000-000000000008'::uuid, 'https://images.pexels.com/photos/17556071/pexels-photo-17556071.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&fit=crop', 'Thika',     -1.0333,        37.0693),
  ('a0000009-0000-4000-8000-000000000009'::uuid, 'https://images.pexels.com/photos/15520558/pexels-photo-15520558.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&fit=crop', 'South B',   -1.3082,        36.8360),
  ('a0000010-0000-4000-8000-000000000010'::uuid, 'https://images.pexels.com/photos/35825348/pexels-photo-35825348.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&fit=crop', 'CBD',       -1.2864,        36.8172)
) as v(id, avatar, area, lat, lng)
where p.id = v.id;
