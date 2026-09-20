-- =====================================================================
-- Vibely - Notify on WhatsApp requests (0033)
--
-- 0032 removed the match requirement so anyone may ask anyone for a
-- WhatsApp number. That opened the ask side but left the answer side
-- unreachable: nothing writes a notifications row when a request is
-- made, and the only places a request surfaces are /matches (which
-- requires a mutual match - the very thing 0032 stopped requiring) and
-- the asker's own /u/<id> profile, which the person being asked has no
-- reason to visit.
--
-- Net effect: A asks B, B is never told, the row sits 'pending'
-- forever. The core handoff could not complete for anyone who was not
-- already matched.
--
-- This adds the missing signal, inside the existing security-definer
-- functions so it cannot be bypassed by a client:
--   * a NEW request notifies the person being asked;
--   * an APPROVAL notifies the asker, whose number is now visible.
--
-- Deliberately silent:
--   * re-asking after a decline (the row is a no-op, so no new
--     notification) - a refusal must not become a way to nag;
--   * declines themselves. The asker simply never gets a number.
--     Telling someone they were turned down adds nothing and invites
--     a follow-up.
--
-- All 0032 semantics are preserved exactly: blocks both directions,
-- the 20-per-24h cap, and decline-is-final.
--
-- Run in the Supabase SQL Editor after 0032.
-- =====================================================================

create or replace function public.request_whatsapp(other_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  me     uuid := auth.uid();
  st     text;
  recent int;
  fresh  int;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  if other_id is null or other_id = me then raise exception 'Invalid request'; end if;

  if exists (
    select 1 from public.blocks
    where (blocker_id = me and blocked_id = other_id)
       or (blocker_id = other_id and blocked_id = me)
  ) then
    raise exception 'Cannot contact this user';
  end if;

  select count(*) into recent
  from public.contact_requests
  where requester_id = me and created_at > now() - interval '24 hours';
  if recent >= 20 then
    raise exception 'Too many requests today. Try again tomorrow.';
  end if;

  insert into public.contact_requests (requester_id, target_id)
  values (me, other_id)
  on conflict (requester_id, target_id) do nothing;
  get diagnostics fresh = row_count;

  -- Only a genuinely new row notifies. Re-asking is a no-op here, so a
  -- declined request cannot be replayed to nag the other person.
  if fresh = 1 then
    insert into public.notifications
      (recipient_id, actor_id, type, entity_type, entity_id, link)
    values
      (other_id, me, 'whatsapp_request', 'profile', me, '/u/' || me::text);
  end if;

  select status into st
  from public.contact_requests
  where requester_id = me and target_id = other_id;
  return st;
end $$;

create or replace function public.respond_whatsapp(from_id uuid, approve boolean)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  me      uuid := auth.uid();
  st      text;
  changed int;
begin
  if me is null then raise exception 'Not authenticated'; end if;

  update public.contact_requests
    set status = case when approve then 'approved' else 'declined' end,
        responded_at = now()
    where requester_id = from_id and target_id = me and status = 'pending';
  get diagnostics changed = row_count;

  -- Approvals notify the asker, because something actionable just
  -- appeared for them. Declines stay silent on purpose.
  if changed = 1 and approve then
    insert into public.notifications
      (recipient_id, actor_id, type, entity_type, entity_id, link)
    values
      (from_id, me, 'whatsapp_approved', 'profile', me, '/u/' || me::text);
  end if;

  select status into st
  from public.contact_requests
  where requester_id = from_id and target_id = me;
  return st;
end $$;

grant execute on function public.request_whatsapp(uuid) to authenticated;
grant execute on function public.respond_whatsapp(uuid, boolean) to authenticated;
