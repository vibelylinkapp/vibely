-- =====================================================================
-- Vibely - Seed demo people (0017)  *** THROWAWAY DEMO DATA ***
-- Creates ~10 Kenyan demo members (mixed age + gender, a mix of verified /
-- unverified and online / offline) placed around Nairobi so Discover, People
-- Nearby, the Heatmap, Trending and Nearby Plans are populated before launch.
--
-- Every seed account is tagged raw_user_meta_data->>'seed' = 'true' and uses
-- an @vibely.link email, so the whole set can be removed with ONE statement
-- (see TEARDOWN at the bottom). Deleting the auth.users cascades to profiles,
-- intents, plans, participants and subscriptions.
--
-- Shared demo password for all seed accounts: VibelyDemo2026!
-- (stored as a bcrypt hash so this migration needs no pgcrypto helpers.)
--
-- Idempotent: safe to run more than once.
-- Run in the Supabase SQL Editor after 0016_post_moderation.sql.
-- =====================================================================

do $$
declare
  pw_hash text := '$2b$10$lOj6TMSnqYp.jrsCA/pgCemLQz8N4RT/d0wEPVLZ7lczm9oXOrjAq';
  rec record;
begin
  for rec in
    select * from (values
      ('a0000001-0000-4000-8000-000000000001'::uuid, 'aisha.demo@vibely.link',   'Aisha Wanjiru',   'aisha_w',   'female'::gender_t, date '1997-04-12', 'UX Designer',      'Nairobi', 'Kilimani',  -1.2907::float8, 36.7869::float8, 'https://randomuser.me/api/portraits/women/68.jpg', 'selfie'::verification_t,      true,  'Designing delightful things. Brunch, Karura walks, good coffee.',           'dating,coffee'),
      ('a0000002-0000-4000-8000-000000000002'::uuid, 'brian.demo@vibely.link',    'Brian Otieno',    'brian_o',   'male',             date '1994-09-03', 'Software Engineer','Nairobi', 'Westlands', -1.2649,        36.8038,        'https://randomuser.me/api/portraits/men/32.jpg',   'none',                        true,  'Full-stack dev. Five-a-side on weekends, always down for a meetup.',         'networking,gym'),
      ('a0000003-0000-4000-8000-000000000003'::uuid, 'cynthia.demo@vibely.link',  'Cynthia Achieng', 'cynthia_a', 'female',           date '1999-01-22', 'Marketing Lead',   'Nairobi', 'Lavington', -1.2795,        36.7666,        'https://randomuser.me/api/portraits/women/44.jpg', 'national_id',                 false, 'Marketing by day, planning my next trip by night.',                         'friendship,travel'),
      ('a0000004-0000-4000-8000-000000000004'::uuid, 'david.demo@vibely.link',    'David Kamau',     'david_k',   'male',             date '1990-06-15', 'Entrepreneur',     'Nairobi', 'Karen',     -1.3197,        36.7085,        'https://randomuser.me/api/portraits/men/75.jpg',   'selfie',                      true,  'Building things in Nairobi. Lets talk ideas over a run.',                   'business,networking'),
      ('a0000005-0000-4000-8000-000000000005'::uuid, 'faith.demo@vibely.link',    'Faith Njeri',     'faith_n',   'female',           date '2001-03-08', 'ICU Nurse',        'Nairobi', 'Kasarani',  -1.2216,        36.8969,        'https://randomuser.me/api/portraits/women/12.jpg', 'phone',                       false, 'ICU nurse. Weekend movies and quiet hangouts recharge me.',                 'hangout,movies'),
      ('a0000006-0000-4000-8000-000000000006'::uuid, 'kevin.demo@vibely.link',    'Kevin Mwangi',    'kevin_m',   'male',             date '1988-11-27', 'Doctor',           'Nairobi', 'Runda',     -1.2167,        36.8072,        'https://randomuser.me/api/portraits/men/51.jpg',   'passport',                    true,  'Doctor who trades scrubs for trail shoes every Saturday.',                  'dating,hiking'),
      ('a0000007-0000-4000-8000-000000000007'::uuid, 'grace.demo@vibely.link',    'Grace Wambui',    'grace_w',   'female',           date '1985-07-19', 'Architect',        'Nairobi', 'Langata',   -1.3520,        36.7420,        'https://randomuser.me/api/portraits/women/90.jpg', 'none',                        false, 'Architect. I sketch buildings and chase the best flat white in town.',      'coffee,friendship'),
      ('a0000008-0000-4000-8000-000000000008'::uuid, 'samuel.demo@vibely.link',   'Samuel Kiprop',   'samuel_k',  'male',             date '1996-02-14', 'Running Coach',    'Nairobi', 'Parklands', -1.2620,        36.8180,        'https://randomuser.me/api/portraits/men/22.jpg',   'selfie',                      true,  'Coach and marathoner. If it involves hills, Im in.',                        'gym,hiking'),
      ('a0000009-0000-4000-8000-000000000009'::uuid, 'mercy.demo@vibely.link',    'Mercy Adhiambo',  'mercy_a',   'female',           date '1993-10-05', 'Chef',             'Nairobi', 'South B',   -1.3082,        36.8360,        'https://randomuser.me/api/portraits/women/24.jpg', 'national_id',                 false, 'Chef. I feed people and dance till late.',                                  'nightlife,hangout'),
      ('a0000010-0000-4000-8000-000000000010'::uuid, 'tony.demo@vibely.link',     'Tony Njoroge',    'tony_n',    'male',             date '1980-12-01', 'Photographer',     'Nairobi', 'CBD',       -1.2864,        36.8172,        'https://randomuser.me/api/portraits/men/85.jpg',   'phone',                       true,  'Photographer chasing light across East Africa.',                            'travel,movies')
    ) as t(id, email, name, handle, gender, bday, occ, county, area, lat, lng, avatar, verif, online, bio, intents)
  loop
    -- 1) Auth user (the on_auth_user_created trigger auto-creates the profile
    --    row + a free subscription). Guarded so re-runs are safe.
    if not exists (select 1 from auth.users where id = rec.id) then
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        email_change_token_current, phone_change, phone_change_token, reauthentication_token
      ) values (
        '00000000-0000-0000-0000-000000000000', rec.id, 'authenticated', 'authenticated',
        rec.email, pw_hash,
        now(), now(), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('name', rec.name, 'seed', 'true'),
        '', '', '', '', '', '', '', ''
      );

      -- 2) Email identity so the shared password can actually sign in.
      --    Wrapped: identity table shape varies across GoTrue versions.
      begin
        insert into auth.identities (
          id, user_id, provider_id, identity_data, provider,
          created_at, updated_at, last_sign_in_at
        ) values (
          gen_random_uuid(), rec.id, rec.id::text,
          jsonb_build_object('sub', rec.id::text, 'email', rec.email, 'email_verified', true),
          'email', now(), now(), now()
        );
      exception when others then
        null; -- profiles still work for discovery even if login identity is skipped
      end;
    end if;

    -- 3) Enrich the auto-created profile with demo detail + geo.
    update public.profiles set
      handle          = rec.handle,
      display_name    = rec.name,
      bio             = rec.bio,
      birthdate       = rec.bday,
      gender          = rec.gender,
      occupation      = rec.occ,
      county          = rec.county,
      area            = rec.area,
      geo             = st_setsrid(st_makepoint(rec.lng, rec.lat), 4326)::geography,
      avatar_url      = rec.avatar,
      verification    = rec.verif,
      is_online       = rec.online,
      last_active_at  = now() - (floor(random() * 240)::text || ' minutes')::interval,
      onboarding_done = true,
      is_private      = false,
      invisible_mode  = false
    where id = rec.id;

    -- 4) Intents (drives Discover filters + nearby "wanted").
    insert into public.profile_intents (profile_id, intent)
    select rec.id, unnest(string_to_array(rec.intents, ',')::intent_t[])
    on conflict do nothing;
  end loop;
end $$;

-- =====================================================================
-- Sample plans hosted by the demo people (Trending + Nearby Plans).
-- Fixed ids so participants attach cleanly and re-runs are idempotent.
-- =====================================================================
insert into public.plans (id, host_id, title, category, description, county, geo, starts_at, max_people, status)
values
  ('b0000001-0000-4000-8000-000000000001', 'a0000008-0000-4000-8000-000000000008', 'Saturday hike at Ngong Hills',        'Hiking',    'Early start, moderate pace, coffee after. All levels welcome.', 'Nairobi', st_setsrid(st_makepoint(36.6500, -1.3833), 4326)::geography, timestamptz '2026-08-01 07:00:00+03', 12, 'open'),
  ('b0000002-0000-4000-8000-000000000002', 'a0000002-0000-4000-8000-000000000002', 'Rooftop sundowners in Westlands',     'Nightlife', 'Golden-hour drinks and good music. Come say hi.',               'Nairobi', st_setsrid(st_makepoint(36.8038, -1.2649), 4326)::geography, timestamptz '2026-08-01 18:30:00+03', 20, 'open'),
  ('b0000003-0000-4000-8000-000000000003', 'a0000001-0000-4000-8000-000000000001', 'Coffee & co-work, Kilimani',          'Coffee',    'Bring your laptop, we grab a corner and get things done.',      'Nairobi', st_setsrid(st_makepoint(36.7869, -1.2907), 4326)::geography, timestamptz '2026-08-03 10:00:00+03',  8, 'open'),
  ('b0000004-0000-4000-8000-000000000004', 'a0000004-0000-4000-8000-000000000004', 'Sunday brunch in Karen',              'Food',      'Long-table brunch. New faces encouraged.',                     'Nairobi', st_setsrid(st_makepoint(36.7085, -1.3197), 4326)::geography, timestamptz '2026-08-02 11:30:00+03', 10, 'open'),
  ('b0000005-0000-4000-8000-000000000005', 'a0000010-0000-4000-8000-000000000010', 'Nairobi National Park game drive',    'Road trip', 'Dawn game drive, carpool from town. Cameras ready.',            'Nairobi', st_setsrid(st_makepoint(36.8280, -1.3600), 4326)::geography, timestamptz '2026-08-04 06:30:00+03',  6, 'open')
on conflict (id) do nothing;

insert into public.plan_participants (plan_id, profile_id)
values
  ('b0000001-0000-4000-8000-000000000001', 'a0000006-0000-4000-8000-000000000006'),
  ('b0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001'),
  ('b0000001-0000-4000-8000-000000000001', 'a0000007-0000-4000-8000-000000000007'),
  ('b0000002-0000-4000-8000-000000000002', 'a0000001-0000-4000-8000-000000000001'),
  ('b0000002-0000-4000-8000-000000000002', 'a0000004-0000-4000-8000-000000000004'),
  ('b0000002-0000-4000-8000-000000000002', 'a0000009-0000-4000-8000-000000000009'),
  ('b0000002-0000-4000-8000-000000000002', 'a0000003-0000-4000-8000-000000000003'),
  ('b0000003-0000-4000-8000-000000000003', 'a0000002-0000-4000-8000-000000000002'),
  ('b0000003-0000-4000-8000-000000000003', 'a0000005-0000-4000-8000-000000000005'),
  ('b0000004-0000-4000-8000-000000000004', 'a0000007-0000-4000-8000-000000000007'),
  ('b0000004-0000-4000-8000-000000000004', 'a0000003-0000-4000-8000-000000000003'),
  ('b0000004-0000-4000-8000-000000000004', 'a0000010-0000-4000-8000-000000000010'),
  ('b0000005-0000-4000-8000-000000000005', 'a0000008-0000-4000-8000-000000000008'),
  ('b0000005-0000-4000-8000-000000000005', 'a0000005-0000-4000-8000-000000000005')
on conflict do nothing;

-- =====================================================================
-- TEARDOWN  --  run this ONE statement at launch to remove ALL demo data.
-- Cascades to profiles, profile_intents, plans, plan_participants,
-- subscriptions, identities, likes, posts, etc.
-- =====================================================================
--   delete from auth.users where raw_user_meta_data->>'seed' = 'true';
