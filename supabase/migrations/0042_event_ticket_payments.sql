-- =====================================================================
-- 0042_event_ticket_payments.sql
--
-- Paid event tickets were free. EventBookButton inserted straight into
-- event_bookings from the browser, and the eb_insert policy only checked
--     profile_id = auth.uid()
-- so anyone could book a KSh 1,000 ticket at no cost. The M-Pesa STK push
-- route existed but served subscription tiers only; nothing connected it
-- to events.
--
-- This adds the missing link:
--   * payments.event_id      - so a payment knows which ticket it buys
--   * event_bookings.status  - 'confirmed' or 'pending_payment'
--   * event_bookings.payment_id
--   * an RLS guard so the browser may only self-insert FREE bookings.
--     Paid bookings are written by the server (service role) after
--     Safaricom confirms, which is the only way a ticket can exist.
--
-- Existing bookings are backfilled to 'confirmed' so nothing is lost.
--
-- Run in the Supabase SQL Editor after 0041.
-- =====================================================================

alter table public.payments
  add column if not exists event_id uuid references public.events(id) on delete set null;

create index if not exists payments_event_idx on public.payments (event_id);

alter table public.event_bookings
  add column if not exists status text not null default 'confirmed',
  add column if not exists payment_id uuid references public.payments(id) on delete set null;

-- Everything booked before today was a free RSVP.
update public.event_bookings set status = 'confirmed' where status is null;

-- ---- RLS: the browser may only create FREE bookings -----------------
-- A paid ticket cannot be self-granted; only the service role writes it,
-- and only after the M-Pesa callback reports success.
drop policy if exists eb_insert on public.event_bookings;
create policy eb_insert on public.event_bookings
  for insert to authenticated
  with check (
    profile_id = auth.uid()
    and status = 'confirmed'
    and exists (
      select 1 from public.events e
       where e.id = event_id
         and coalesce(e.price_kes, 0) = 0
    )
  );

-- Members may still cancel their own booking, paid or free.
drop policy if exists eb_delete on public.event_bookings;
create policy eb_delete on public.event_bookings
  for delete to authenticated
  using (profile_id = auth.uid());

-- Verify:
--   select status, count(*) from public.event_bookings group by status;
--   -- a free event should still book from the app;
--   -- a paid one must go through /api/events/stkpush.
