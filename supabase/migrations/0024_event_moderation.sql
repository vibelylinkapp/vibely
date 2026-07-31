-- =====================================================================
-- Vibely - Event moderation (0024)
-- Member-created events must be reviewed by an admin before they go public.
--   * New member events land in 'pending' (already hidden from the public by
--     the 0020 read policy, which only exposes status = 'published').
--   * Only admins can publish or feature (is_trending) an event. This is
--     enforced at the DB layer by a trigger so a crafted client cannot
--     self-publish by calling .update({ status: 'published' }).
--   * House / curated events created straight from the SQL editor or an
--     admin's own in-app "Host" form are auto-published.
--   * Editing a rejected event automatically re-queues it for review.
-- Run in the Supabase SQL Editor after 0023_fix_demo_imagery.sql.
-- =====================================================================

-- 1) Moderation metadata + a pending-by-default status.
alter table public.events add column if not exists reviewed_at     timestamptz;
alter table public.events add column if not exists reviewed_by     uuid references public.profiles(id) on delete set null;
alter table public.events add column if not exists rejected_reason text;

alter table public.events alter column status set default 'pending';

alter table public.events drop constraint if exists events_status_chk;
alter table public.events
  add constraint events_status_chk check (status in ('pending', 'published', 'rejected'));

create index if not exists events_status_idx on public.events (status);

-- 2) Moderation guard. Runs BEFORE insert/update on every event write.
--    A trusted context (SQL editor / service role) has no JWT, so auth.uid()
--    is null there and the trigger passes the row through untouched - that is
--    how seeded + service-role admin actions keep their explicit status.
create or replace function public.events_guard_moderation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
begin
  if auth.uid() is null then
    return new;  -- trusted: seeds, service-role admin actions
  end if;

  select coalesce(p.is_admin, false) into v_is_admin
    from public.profiles p
   where p.id = auth.uid();
  v_is_admin := coalesce(v_is_admin, false);

  if v_is_admin then
    if tg_op = 'INSERT' then
      if new.status = 'pending' then
        new.status := 'published';   -- admin-hosted events go live immediately
      end if;
      if new.status = 'published' then
        new.reviewed_at := now();
        new.reviewed_by := auth.uid();
      end if;
    elsif new.status is distinct from old.status then
      new.reviewed_at := now();
      new.reviewed_by := auth.uid();
    end if;
    return new;
  end if;

  -- Non-admin member:
  if tg_op = 'INSERT' then
    new.status          := 'pending';
    new.is_trending     := false;
    new.reviewed_at     := null;
    new.reviewed_by     := null;
    new.rejected_reason := null;
    return new;
  else
    -- Members may edit their own event's content but never self-moderate.
    if new.status is distinct from old.status and new.status = 'published' then
      raise exception 'Only an admin can publish an event';
    end if;
    if new.status is distinct from old.status and new.status not in ('pending', 'rejected') then
      raise exception 'Invalid event status change';
    end if;
    -- Editing a rejected event resubmits it for review.
    if old.status = 'rejected' then
      new.status          := 'pending';
      new.rejected_reason := null;
    end if;
    if new.is_trending is distinct from old.is_trending then
      raise exception 'Only an admin can feature an event';
    end if;
    -- Review metadata is admin-owned; never let a member forge it.
    new.reviewed_at := old.reviewed_at;
    new.reviewed_by := old.reviewed_by;
    return new;
  end if;
end;
$$;

drop trigger if exists events_guard_moderation_trg on public.events;
create trigger events_guard_moderation_trg
  before insert or update on public.events
  for each row execute function public.events_guard_moderation();

-- 3) Any member events that slipped in as 'published' before this migration
--    (created while the old default was 'published') get sent for review.
--    House events (created_by is null) are left published.
update public.events
   set status = 'pending'
 where created_by is not null
   and status = 'published'
   and reviewed_at is null;
