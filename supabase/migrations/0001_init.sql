-- =====================================================================
-- Vibely — Supabase / PostgreSQL schema (MVP + v1 stubs)
-- Kenya-first social discovery platform
-- Paste into Supabase SQL Editor, or save as supabase/migrations/0001_init.sql
-- Requires: Postgres 15+ (Supabase default). Uses PostGIS for geo/heatmap.
-- =====================================================================

-- ---------- Extensions ----------
create extension if not exists "postgis";        -- geography types, nearby queries, heatmap
create extension if not exists "pgcrypto";       -- gen_random_uuid()
create extension if not exists "pg_trgm";         -- fuzzy text search on names/locations

-- =====================================================================
-- ENUMS
-- =====================================================================
create type gender_t          as enum ('male','female','nonbinary','other');
create type intent_t          as enum ('dating','friendship','hangout','weekend','gym','hiking','coffee','networking','business','travel','movies','nightlife');
create type verification_t    as enum ('none','phone','selfie','national_id','passport');
create type report_status_t   as enum ('open','reviewing','actioned','dismissed');
create type message_kind_t    as enum ('text','image','video','voice','system','meet_request');
create type plan_status_t     as enum ('open','full','closed','cancelled');
create type sub_tier_t        as enum ('free','plus','gold','vip');
create type sub_status_t      as enum ('active','past_due','cancelled','expired');

-- =====================================================================
-- PROFILES  (1:1 with auth.users)
-- =====================================================================
create table public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  handle            text unique,
  display_name      text not null,
  bio               text,
  birthdate         date,                          -- enforce 18+ in app + trigger below
  gender            gender_t,
  occupation        text,
  education         text,
  languages         text[] default '{}',
  religion          text,
  height_cm         int,
  county            text,                           -- e.g. 'Nairobi'
  area              text,                           -- neighbourhood/town
  geo               geography(Point,4326),          -- lat/lng for nearby + heatmap
  avatar_url        text,
  cover_url         text,
  verification      verification_t not null default 'none',
  is_verified       boolean generated always as (verification <> 'none' and verification <> 'phone') stored,
  safety_score      int not null default 50,        -- 0-100, computed by moderation jobs
  is_online         boolean not null default false,
  last_active_at    timestamptz,
  is_private        boolean not null default false, -- hide from discovery
  invisible_mode    boolean not null default false, -- premium: browse without being seen
  onboarding_done   boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index profiles_geo_idx      on public.profiles using gist (geo);
create index profiles_county_idx   on public.profiles (county);
create index profiles_online_idx   on public.profiles (is_online) where is_online;
create index profiles_name_trgm    on public.profiles using gin (display_name gin_trgm_ops);

-- 18+ guard
create or replace function public.enforce_adult() returns trigger as $$
begin
  if new.birthdate is not null and new.birthdate > (current_date - interval '18 years') then
    raise exception 'User must be at least 18 years old';
  end if;
  return new;
end $$ language plpgsql;
create trigger trg_enforce_adult before insert or update on public.profiles
  for each row execute function public.enforce_adult();

-- keep updated_at fresh
create or replace function public.touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end $$ language plpgsql;
create trigger trg_touch_profiles before update on public.profiles
  for each row execute function public.touch_updated_at();

-- =====================================================================
-- PROFILE INTENTS  (multi-select "looking for")
-- =====================================================================
create table public.profile_intents (
  profile_id uuid references public.profiles(id) on delete cascade,
  intent     intent_t not null,
  primary key (profile_id, intent)
);
create index profile_intents_intent_idx on public.profile_intents (intent);

-- =====================================================================
-- PHOTO GALLERY
-- =====================================================================
create table public.photos (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  url         text not null,               -- Supabase Storage path
  position    int  not null default 0,
  is_approved boolean not null default false, -- set true by moderation
  created_at  timestamptz not null default now()
);
create index photos_profile_idx on public.photos (profile_id);

-- =====================================================================
-- LIKES  (directional)
-- =====================================================================
create table public.likes (
  liker_id  uuid not null references public.profiles(id) on delete cascade,
  liked_id  uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (liker_id, liked_id),
  check (liker_id <> liked_id)
);
create index likes_liked_idx on public.likes (liked_id);
-- a "match" is simply a mutual like; query with a self-join or a view:
create view public.matches as
  select least(a.liker_id,a.liked_id) as u1, greatest(a.liker_id,a.liked_id) as u2
  from public.likes a join public.likes b
    on a.liker_id = b.liked_id and a.liked_id = b.liker_id
  group by 1,2;

-- =====================================================================
-- PROFILE VIEWS  ("who reached out / viewed you")
-- =====================================================================
create table public.profile_views (
  viewer_id  uuid not null references public.profiles(id) on delete cascade,
  viewed_id  uuid not null references public.profiles(id) on delete cascade,
  viewed_at  timestamptz not null default now(),
  primary key (viewer_id, viewed_id)
);
create index profile_views_viewed_idx on public.profile_views (viewed_id, viewed_at desc);

-- =====================================================================
-- BLOCKS
-- =====================================================================
create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

-- =====================================================================
-- CONVERSATIONS + MESSAGES  (in-app chat — the retention loop)
-- =====================================================================
create table public.conversations (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  last_msg_at timestamptz
);
create table public.conversation_members (
  conversation_id uuid references public.conversations(id) on delete cascade,
  profile_id      uuid references public.profiles(id) on delete cascade,
  last_read_at    timestamptz,
  primary key (conversation_id, profile_id)
);
create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  kind            message_kind_t not null default 'text',
  body            text,
  media_url       text,
  is_flagged      boolean not null default false,   -- set by AI scam/abuse check
  created_at      timestamptz not null default now(),
  edited_at       timestamptz,
  deleted_at      timestamptz
);
create index messages_convo_idx on public.messages (conversation_id, created_at desc);

-- bump conversation.last_msg_at on new message
create or replace function public.bump_convo() returns trigger as $$
begin update public.conversations set last_msg_at = new.created_at where id = new.conversation_id; return new; end $$ language plpgsql;
create trigger trg_bump_convo after insert on public.messages
  for each row execute function public.bump_convo();

-- =====================================================================
-- STORIES  (24h, WhatsApp-style)
-- =====================================================================
create table public.stories (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  media_url   text not null,
  caption     text,
  mood        text,
  is_approved boolean not null default false,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '24 hours')
);
create index stories_active_idx on public.stories (profile_id, expires_at);

-- =====================================================================
-- PLANS / MEETUPS  (v1)
-- =====================================================================
create table public.plans (
  id          uuid primary key default gen_random_uuid(),
  host_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  category    text not null,                 -- coffee, hiking, movie, road trip...
  description text,
  county      text,
  geo         geography(Point,4326),
  starts_at   timestamptz,
  max_people  int,
  status      plan_status_t not null default 'open',
  created_at  timestamptz not null default now()
);
create index plans_geo_idx on public.plans using gist (geo);
create table public.plan_participants (
  plan_id    uuid references public.plans(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (plan_id, profile_id)
);

-- =====================================================================
-- REPORTS  (trust & safety)
-- =====================================================================
create table public.reports (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid references public.profiles(id) on delete set null,
  reported_id   uuid references public.profiles(id) on delete cascade,
  reason        text not null,
  detail        text,
  status        report_status_t not null default 'open',
  created_at    timestamptz not null default now(),
  resolved_at   timestamptz
);
create index reports_status_idx on public.reports (status, created_at);

-- =====================================================================
-- SUBSCRIPTIONS + M-PESA PAYMENTS
-- =====================================================================
create table public.subscriptions (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  tier          sub_tier_t not null default 'free',
  status        sub_status_t not null default 'active',
  started_at    timestamptz not null default now(),
  expires_at    timestamptz,
  created_at    timestamptz not null default now()
);
create index subscriptions_profile_idx on public.subscriptions (profile_id);

create table public.payments (
  id                 uuid primary key default gen_random_uuid(),
  profile_id         uuid references public.profiles(id) on delete set null,
  provider           text not null default 'mpesa',   -- mpesa | airtel | card | paypal
  amount_kes         numeric(10,2) not null,
  mpesa_checkout_id  text,                             -- Daraja CheckoutRequestID
  mpesa_receipt      text,                             -- MpesaReceiptNumber
  phone              text,
  status             text not null default 'pending',  -- pending | success | failed
  raw_callback       jsonb,
  created_at         timestamptz not null default now()
);
create index payments_profile_idx on public.payments (profile_id, created_at desc);

-- =====================================================================
-- NEARBY QUERY HELPER  (discovery + map)
-- returns profiles within radius_m metres of a point, nearest first
-- =====================================================================
create or replace function public.nearby_profiles(
  in_lat double precision,
  in_lng double precision,
  radius_m double precision default 25000,
  wanted intent_t default null
) returns table (
  id uuid, display_name text, avatar_url text, county text,
  distance_m double precision, is_online boolean, is_verified boolean
) language sql stable as $$
  select p.id, p.display_name, p.avatar_url, p.county,
         st_distance(p.geo, st_setsrid(st_makepoint(in_lng,in_lat),4326)::geography) as distance_m,
         p.is_online, p.is_verified
  from public.profiles p
  where p.geo is not null
    and not p.is_private and not p.invisible_mode and p.onboarding_done
    and st_dwithin(p.geo, st_setsrid(st_makepoint(in_lng,in_lat),4326)::geography, radius_m)
    and (wanted is null or exists (
      select 1 from public.profile_intents pi where pi.profile_id = p.id and pi.intent = wanted))
  order by distance_m asc
  limit 200;
$$;

-- =====================================================================
-- ROW LEVEL SECURITY
-- Turn RLS on everywhere; expose data through safe policies only.
-- =====================================================================
alter table public.profiles             enable row level security;
alter table public.profile_intents      enable row level security;
alter table public.photos               enable row level security;
alter table public.likes                enable row level security;
alter table public.profile_views        enable row level security;
alter table public.blocks               enable row level security;
alter table public.conversations        enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages             enable row level security;
alter table public.stories              enable row level security;
alter table public.plans                enable row level security;
alter table public.plan_participants    enable row level security;
alter table public.reports              enable row level security;
alter table public.subscriptions        enable row level security;
alter table public.payments             enable row level security;

-- PROFILES: anyone signed-in can read public/discoverable profiles; you edit only your own.
create policy profiles_read on public.profiles for select using (
  auth.role() = 'authenticated'
  and not exists (select 1 from public.blocks b where b.blocker_id = profiles.id and b.blocked_id = auth.uid())
);
create policy profiles_insert on public.profiles for insert with check (id = auth.uid());
create policy profiles_update on public.profiles for update using (id = auth.uid());

-- INTENTS / PHOTOS: readable by authenticated; writable by owner.
create policy intents_read   on public.profile_intents for select using (auth.role() = 'authenticated');
create policy intents_write  on public.profile_intents for all    using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy photos_read    on public.photos for select using (auth.role() = 'authenticated');
create policy photos_write   on public.photos for all    using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- LIKES / VIEWS / BLOCKS: you write your own edges; you can read edges pointing at you.
create policy likes_write on public.likes for all using (liker_id = auth.uid()) with check (liker_id = auth.uid());
create policy likes_read  on public.likes for select using (liker_id = auth.uid() or liked_id = auth.uid());
create policy views_write on public.profile_views for all using (viewer_id = auth.uid()) with check (viewer_id = auth.uid());
create policy views_read  on public.profile_views for select using (viewer_id = auth.uid() or viewed_id = auth.uid());
create policy blocks_rw   on public.blocks for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- CONVERSATIONS / MESSAGES: only members can see or post.
create policy convo_read on public.conversations for select using (
  exists (select 1 from public.conversation_members m where m.conversation_id = id and m.profile_id = auth.uid()));
create policy cmembers_read on public.conversation_members for select using (
  exists (select 1 from public.conversation_members m2 where m2.conversation_id = conversation_members.conversation_id and m2.profile_id = auth.uid()));
create policy messages_read on public.messages for select using (
  exists (select 1 from public.conversation_members m where m.conversation_id = messages.conversation_id and m.profile_id = auth.uid()));
create policy messages_send on public.messages for insert with check (
  sender_id = auth.uid() and exists (
    select 1 from public.conversation_members m where m.conversation_id = messages.conversation_id and m.profile_id = auth.uid()));

-- STORIES: authenticated read (active only enforced in query); owner writes.
create policy stories_read  on public.stories for select using (auth.role() = 'authenticated');
create policy stories_write on public.stories for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- PLANS: authenticated read; host writes; anyone can join (participant = self).
create policy plans_read  on public.plans for select using (auth.role() = 'authenticated');
create policy plans_write on public.plans for all using (host_id = auth.uid()) with check (host_id = auth.uid());
create policy plan_join   on public.plan_participants for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- REPORTS: reporter can insert & see their own; moderation runs via service role (bypasses RLS).
create policy reports_insert on public.reports for insert with check (reporter_id = auth.uid());
create policy reports_read   on public.reports for select using (reporter_id = auth.uid());

-- SUBSCRIPTIONS / PAYMENTS: owner reads; writes happen server-side via service role.
create policy subs_read on public.subscriptions for select using (profile_id = auth.uid());
create policy pay_read  on public.payments      for select using (profile_id = auth.uid());

-- =====================================================================
-- AUTO-CREATE a profile row when a new auth user signs up
-- =====================================================================
create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'New member'));
  insert into public.subscriptions (profile_id, tier) values (new.id, 'free');
  return new;
end $$ language plpgsql security definer;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- End of schema. Next: create Storage buckets `avatars`, `gallery`,
-- `stories` (all with authenticated read + owner write policies) and a
-- scheduled job to delete expired stories.
-- =====================================================================
