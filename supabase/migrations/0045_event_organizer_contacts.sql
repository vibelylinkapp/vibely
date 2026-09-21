-- =====================================================================
-- 0045_event_organizer_contacts.sql
--
-- An attendee who paid for an event had NO way to reach the organizer.
-- public.events carried one organizer field -- host_name text -- with
-- no email and no phone. If an event did not happen, the buyer had
-- nobody to contact.
--
-- This matters more than usual because of how ticket money now moves.
-- Paystack splits at the point of collection: the platform keeps its
-- commission and the organizer's share settles straight to their
-- M-Pesa. Vibely therefore CANNOT refund a ticket -- it never holds
-- the organizer's money. Refunds are between attendee and organizer,
-- so reaching the organizer is the whole remedy, and it has to work.
--
-- PRIVACY: these details do NOT go on public.events. The events_read
-- policy exposes every published event to every authenticated user, so
-- a phone number there would be scrapeable by anyone with an account.
-- They live in their own table, readable only by:
--   * the organizer themselves,
--   * members holding a CONFIRMED booking for that event,
--   * admins (for verification and dispute handling).
--
-- Enforcement note: a paid event should not be published without
-- contact details. That is enforced in the app and checked in the
-- admin review queue rather than by a table constraint, because the
-- event row has to exist before its contact row can reference it.
--
-- Run in the Supabase SQL Editor after 0044.
-- =====================================================================

create table if not exists public.event_organizer_contacts (
  event_id   uuid primary key references public.events(id) on delete cascade,
  email      text,
  phone      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.event_organizer_contacts enable row level security;

-- ---- read: organizer, confirmed ticket holders, admins --------------
drop policy if exists eoc_read on public.event_organizer_contacts;
create policy eoc_read on public.event_organizer_contacts
  for select to authenticated
  using (
    exists (
      select 1 from public.events e
       where e.id = event_organizer_contacts.event_id
         and e.created_by = auth.uid()
    )
    or exists (
      select 1 from public.event_bookings b
       where b.event_id = event_organizer_contacts.event_id
         and b.profile_id = auth.uid()
         and b.status = 'confirmed'
    )
    or exists (
      select 1 from public.profiles p
       where p.id = auth.uid()
         and coalesce(p.is_admin, false)
    )
  );

-- ---- write: only the organizer of that event -----------------------
drop policy if exists eoc_insert on public.event_organizer_contacts;
create policy eoc_insert on public.event_organizer_contacts
  for insert to authenticated
  with check (
    exists (
      select 1 from public.events e
       where e.id = event_organizer_contacts.event_id
         and e.created_by = auth.uid()
    )
  );

drop policy if exists eoc_update on public.event_organizer_contacts;
create policy eoc_update on public.event_organizer_contacts
  for update to authenticated
  using (
    exists (
      select 1 from public.events e
       where e.id = event_organizer_contacts.event_id
         and e.created_by = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.events e
       where e.id = event_organizer_contacts.event_id
         and e.created_by = auth.uid()
    )
  );

-- Verify:
--   -- as a member with no ticket: expect 0 rows
--   select * from public.event_organizer_contacts;
--   -- which paid events are missing contact details (admin review):
--   select e.id, e.title, e.price_kes
--     from public.events e
--     left join public.event_organizer_contacts c on c.event_id = e.id
--    where e.price_kes > 0 and c.event_id is null;
