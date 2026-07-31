-- =====================================================================
-- Vibely - Events + Trending (0020)
-- Curated / hosted events power "Trending near you" and the Events screen.
-- Members book a spot (RSVP) via event_bookings; hosts and admins can edit
-- their own events. going_base lets seeded events show a realistic crowd on
-- top of real bookings without inventing fake booking rows.
-- Run in the Supabase SQL Editor after 0019_heatmap.sql.
-- =====================================================================

create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  created_by  uuid references public.profiles(id) on delete set null,
  title       text not null,
  description text,
  category    text,
  venue       text,
  area        text,
  city        text not null default 'Nairobi',
  country     text not null default 'Kenya',
  geo         geography(Point, 4326),
  image_url   text,
  starts_at   timestamptz,
  ends_at     timestamptz,
  price_kes   integer not null default 0,
  capacity    integer,
  host_name   text,
  going_base  integer not null default 0,
  is_trending boolean not null default false,
  status      text not null default 'published',
  created_at  timestamptz not null default now()
);

create index if not exists events_starts_idx on public.events (starts_at);
create index if not exists events_trending_idx on public.events (is_trending) where is_trending;
create index if not exists events_geo_idx on public.events using gist (geo);

create table if not exists public.event_bookings (
  event_id   uuid references public.events(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, profile_id)
);

alter table public.events enable row level security;
alter table public.event_bookings enable row level security;

-- ---- events RLS ----------------------------------------------------
drop policy if exists events_read on public.events;
create policy events_read on public.events for select to authenticated
  using (
    status = 'published'
    or created_by = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

drop policy if exists events_insert on public.events;
create policy events_insert on public.events for insert to authenticated
  with check (created_by = auth.uid());

drop policy if exists events_update on public.events;
create policy events_update on public.events for update to authenticated
  using (
    created_by = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  )
  with check (
    created_by = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

drop policy if exists events_delete on public.events;
create policy events_delete on public.events for delete to authenticated
  using (
    created_by = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- ---- event_bookings RLS -------------------------------------------
drop policy if exists eb_read on public.event_bookings;
create policy eb_read on public.event_bookings for select to authenticated
  using (
    profile_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
    or exists (select 1 from public.events e where e.id = event_id and e.created_by = auth.uid())
  );

drop policy if exists eb_insert on public.event_bookings;
create policy eb_insert on public.event_bookings for insert to authenticated
  with check (profile_id = auth.uid());

drop policy if exists eb_delete on public.event_bookings;
create policy eb_delete on public.event_bookings for delete to authenticated
  using (profile_id = auth.uid());
