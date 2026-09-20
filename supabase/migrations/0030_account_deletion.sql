-- =====================================================================
-- Vibely - Self-service account deletion (0030)
--
-- Deleting a member means deleting their auth.users row: profiles cascades
-- from it, and everything else cascades from profiles. Before that can be
-- safe we need two things:
--
--   1. An audit record that OUTLIVES the member, so we can show a regulator
--      that a deletion request was made and honoured, and so a banned member
--      cannot delete-and-return with a clean slate. account_deletions has no
--      foreign key to profiles on purpose.
--
--   2. Moderation history that survives. reports.reported_id currently
--      CASCADEs, so deleting an abusive account also erased every report
--      about them - exactly backwards. This flips it to SET NULL and stamps
--      a snapshot onto the report rows first, so the record of what happened
--      remains without retaining a live profile.
--
-- Already correct, left alone: payments.profile_id, reports.reporter_id,
-- admin_actions.admin_id/target_id and events.created_by are all SET NULL.
--
-- Run in the Supabase SQL Editor after 0029_contact_sharing.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Deletion audit log (service-role only, no FK, survives the member)
-- ---------------------------------------------------------------------
create table if not exists public.account_deletions (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null,          -- deliberately NOT a foreign key
  display_name   text,
  handle         text,
  identity_hash  text,                   -- sha256 of the sign-in email/phone
  reason         text,
  deleted_by     text not null default 'self'
                   check (deleted_by in ('self', 'admin')),
  was_banned     boolean not null default false,
  open_reports   int not null default 0,
  files_removed  int not null default 0,
  requested_at   timestamptz not null default now(),
  completed_at   timestamptz
);

create index if not exists account_deletions_profile_idx
  on public.account_deletions (profile_id);
create index if not exists account_deletions_requested_idx
  on public.account_deletions (requested_at desc);
create index if not exists account_deletions_identity_idx
  on public.account_deletions (identity_hash)
  where identity_hash is not null;

alter table public.account_deletions enable row level security;
-- No policies. Only the service role (server side) may read or write this.

-- ---------------------------------------------------------------------
-- 2. Keep reports after the reported account is gone
-- ---------------------------------------------------------------------
alter table public.reports
  add column if not exists reported_snapshot jsonb;

comment on column public.reports.reported_snapshot is
  'Minimal record of the reported member, stamped just before their profile '
  'is deleted, so moderation history survives the deletion.';

-- Stamp the snapshot before the profile row disappears.
create or replace function public.snapshot_reports_before_profile_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.reports r
     set reported_snapshot = jsonb_build_object(
           'profile_id',   old.id,
           'display_name', old.display_name,
           'handle',       old.handle,
           'county',       old.county,
           'was_banned',   old.is_banned,
           'deleted_at',   now()
         )
   where r.reported_id = old.id
     and r.reported_snapshot is null;
  return old;
end $$;

drop trigger if exists trg_snapshot_reports_before_delete on public.profiles;
create trigger trg_snapshot_reports_before_delete
  before delete on public.profiles
  for each row
  execute function public.snapshot_reports_before_profile_delete();

-- Now it is safe to stop cascading reports away.
alter table public.reports
  drop constraint if exists reports_reported_id_fkey;
alter table public.reports
  add constraint reports_reported_id_fkey
  foreign key (reported_id) references public.profiles(id) on delete set null;

-- reported_id must be nullable for SET NULL to work.
alter table public.reports alter column reported_id drop not null;
