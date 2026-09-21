-- =====================================================================
-- 0043_host_payouts.sql
--
-- Event money currently lands in the platform's own M-Pesa till, so the
-- platform holds the host's share until someone pays it out by hand.
-- Paystack's diagnostic confirmed a Kenyan subaccount CAN settle to
-- M-Pesa (settlement_bank code 'MPESA'), so the host's share can be
-- split off at the moment of collection and never be ours at all.
--
-- This migration stores what that needs:
--   * host_payouts  - one row per host: their M-Pesa number and the
--                     Paystack subaccount code created for them.
--   * events.commission_pct - per-event override of the platform cut.
--   * payments breakdown columns - what the buyer paid, what we kept,
--                     and what settled to the host, recorded per
--                     transaction so revenue is auditable.
--
-- PRIVACY: payout details deliberately do NOT live on public.profiles.
-- The existing profiles read policy is broad, so a phone number there
-- would be readable by any authenticated user. host_payouts is
-- owner-only; the server reads it with the service role at checkout.
--
-- Run in the Supabase SQL Editor after 0042.
-- =====================================================================

create table if not exists public.host_payouts (
  profile_id                uuid primary key
                              references public.profiles(id) on delete cascade,
  mpesa_number              text,
  settlement_bank           text not null default 'MPESA',
  paystack_subaccount_code  text,
  status                    text not null default 'pending',  -- pending | active | failed
  last_error                text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists host_payouts_subaccount_idx
  on public.host_payouts (paystack_subaccount_code);

alter table public.host_payouts enable row level security;

-- A host may only ever see or touch their own payout details.
drop policy if exists hp_self_read on public.host_payouts;
create policy hp_self_read on public.host_payouts
  for select to authenticated
  using (profile_id = auth.uid());

drop policy if exists hp_self_insert on public.host_payouts;
create policy hp_self_insert on public.host_payouts
  for insert to authenticated
  with check (profile_id = auth.uid());

drop policy if exists hp_self_update on public.host_payouts;
create policy hp_self_update on public.host_payouts
  for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ---- per-event commission override ---------------------------------
alter table public.events
  add column if not exists commission_pct numeric(5,2);

comment on column public.events.commission_pct is
  'Platform commission for this event as a percent. NULL means use the default in lib/commission.ts.';

-- ---- per-payment money breakdown -----------------------------------
alter table public.payments
  add column if not exists commission_kes   numeric(10,2),
  add column if not exists net_to_host_kes  numeric(10,2),
  add column if not exists paystack_reference text,
  add column if not exists host_profile_id  uuid
                             references public.profiles(id) on delete set null;

create index if not exists payments_paystack_ref_idx
  on public.payments (paystack_reference);

-- Verify:
--   select * from public.host_payouts;
--   select column_name from information_schema.columns
--    where table_name = 'payments' and column_name in
--      ('commission_kes','net_to_host_kes','paystack_reference','host_profile_id');
