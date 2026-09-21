-- =====================================================================
-- 0037_fix_seeded_member_profiles.sql
--
-- Repairs 0035, which silently did nothing to public.profiles.
--
-- WHAT WENT WRONG:
--   0001_init.sql:361 defines
--       create trigger on_auth_user_created after insert on auth.users
--         for each row execute function public.handle_new_user();
--   and that function inserts a bare profiles row (id + display_name)
--   the instant an auth user is created.
--
--   0035 inserted the auth users first, so by the time it reached
--       insert into public.profiles ... on conflict (id) do nothing
--   a row already existed for every id and all ten inserts were
--   skipped without error. The result was ten profiles named
--   "New member" with no county, bio, avatar or is_demo flag, which is
--   why they never appeared on any discovery surface.
--
--   The auth users and profile rows DO exist, so this migration
--   updates them rather than inserting again.
--
-- Safe to run more than once. Run in the Supabase SQL Editor after 0036.
-- =====================================================================

do $$
declare
  rec record;
begin
  for rec in
    select * from (values
      ('a5e10001-0000-4000-8000-000000000001'::uuid, 'amina_w',   'Amina Wanjiru',   'Marketing by day, food markets by weekend. Show me somewhere new.',  date '1999-03-14', 'female'::gender_t, 'Marketing Associate', 'BCom, Strathmore University',      'Nairobi',    'Westlands',   165, 'selfie'::verification_t,      true,  array['dating','coffee','travel']::intent_t[]),
      ('a5e10002-0000-4000-8000-000000000002'::uuid, 'brian_ot',  'Brian Otieno',    'Engineer. Lake sunsets, live music, and a good samosa.',             date '1995-07-02', 'male'::gender_t,   'Civil Engineer',      'BSc Civil Engineering, JKUAT',     'Kisumu',     'Milimani',    181, 'phone'::verification_t,       true,  array['dating','friendship','nightlife']::intent_t[]),
      ('a5e10003-0000-4000-8000-000000000003'::uuid, 'cynthia_m', 'Cynthia Mwikali', 'Nurse. Early shifts, late laughs. Coffee is non-negotiable.',        date '2001-11-21', 'female'::gender_t, 'Nurse',               'BScN, Kenyatta University',        'Nairobi',    'Kilimani',    160, 'selfie'::verification_t,      true,  array['coffee','friendship','movies']::intent_t[]),
      ('a5e10004-0000-4000-8000-000000000004'::uuid, 'david_kip', 'David Kiprop',    'Coach. Up at five, honest about it. Bring your running shoes.',      date '1997-01-30', 'male'::gender_t,   'Athletics Coach',     'Diploma in Sports Science',        'Uasin Gishu','Eldoret',     176, 'national_id'::verification_t, false, array['gym','hiking','friendship']::intent_t[]),
      ('a5e10005-0000-4000-8000-000000000005'::uuid, 'faith_nj',  'Faith Njeri',     'Teacher. Books, road trips and very strong tea.',                    date '2000-05-09', 'female'::gender_t, 'Primary Teacher',     'BEd, Egerton University',          'Nakuru',     'Nakuru Town', 163, 'phone'::verification_t,       false, array['dating','travel','coffee']::intent_t[]),
      ('a5e10006-0000-4000-8000-000000000006'::uuid, 'kevin_mut', 'Kevin Mutua',     'Chef. I will feed you and argue about pilau. Both are serious.',     date '1993-09-17', 'male'::gender_t,   'Chef',                'Utalii College',                   'Nairobi',    'Karen',       179, 'selfie'::verification_t,      true,  array['dating','nightlife','friendship']::intent_t[]),
      ('a5e10007-0000-4000-8000-000000000007'::uuid, 'leila_ab',  'Leila Abdalla',   'Coast born. Old Town walks, dhow rides, slow mornings.',             date '1998-02-25', 'female'::gender_t, 'Tour Consultant',     'Diploma in Tourism, TUM',          'Mombasa',    'Nyali',       167, 'selfie'::verification_t,      true,  array['travel','coffee','friendship']::intent_t[]),
      ('a5e10008-0000-4000-8000-000000000008'::uuid, 'samuel_b',  'Samuel Barasa',   'Agronomist. Quiet weekends, green things, long drives.',             date '1996-06-11', 'male'::gender_t,   'Agronomist',          'BSc Agriculture, Egerton',         'Kiambu',     'Thika',       174, 'phone'::verification_t,       false, array['friendship','hiking','business']::intent_t[]),
      ('a5e10009-0000-4000-8000-000000000009'::uuid, 'grace_che', 'Grace Chebet',    'Designer. Thrift finds, gallery openings, terrible puns.',           date '2002-08-03', 'female'::gender_t, 'Graphic Designer',    'BA Design, University of Nairobi', 'Nairobi',    'Kileleshwa',  169, 'phone'::verification_t,       true,  array['dating','movies','networking']::intent_t[]),
      ('a5e10010-0000-4000-8000-000000000010'::uuid, 'tony_odh',  'Tony Odhiambo',   'Dive instructor in Diani. The ocean is the whole personality.',      date '1994-04-19', 'male'::gender_t,   'Dive Instructor',     'PADI Instructor Certification',    'Kwale',      'Diani',       183, 'selfie'::verification_t,      true,  array['travel','hangout','gym']::intent_t[])
    ) as t(id, handle, display_name, bio, birthdate, gender, occupation, education, county, area, height_cm, verification, is_online, intents)
  loop
    update public.profiles set
      handle          = rec.handle,
      display_name    = rec.display_name,
      bio             = rec.bio,
      birthdate       = rec.birthdate,
      gender          = rec.gender,
      occupation      = rec.occupation,
      education       = rec.education,
      languages       = array['English','Swahili'],
      height_cm       = rec.height_cm,
      county          = rec.county,
      area            = rec.area,
      avatar_url      = '/seed/' || rec.handle || '.jpg',
      cover_url       = 'https://picsum.photos/seed/' || rec.handle || '-cover/1000/600',
      verification    = rec.verification,
      is_online       = rec.is_online,
      last_active_at  = now() - (floor(random() * 240) || ' minutes')::interval,
      onboarding_done = true,
      is_demo         = true,
      updated_at      = now()
    where id = rec.id;

    -- Interest tags drive the match percentage on the People-near-you cards.
    insert into public.profile_intents (profile_id, intent)
    select rec.id, unnest(rec.intents)
    on conflict do nothing;
  end loop;
end $$;

-- Verify:
--   select count(*) from public.profiles where is_demo;                      -- expect 10
--   select count(*) from public.profiles where display_name = 'New member';  -- expect 0
--   select display_name, county, area, avatar_url
--     from public.profiles where is_demo order by display_name;
