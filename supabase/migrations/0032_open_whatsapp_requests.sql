-- =====================================================================
-- Vibely - Open the WhatsApp handoff (0032)
--
-- 0029 built the whole handoff - a private number, an ask/approve
-- request, and a reveal that only fires after approval - then gated the
-- ASK behind a mutual match:
--
--     raise exception 'You can only request WhatsApp from a match';
--
-- With a small member base almost nobody reaches a mutual like, so the
-- feature is unreachable in practice. This drops the match requirement:
-- anyone may ASK, and the person asked still decides. Consent stays
-- exactly where it was - on the owner of the number.
--
-- What is deliberately kept:
--   * blocks are still absolute, in both directions;
--   * a number is still only revealed after an explicit approval;
--   * a decline is final - the unique(requester_id, target_id) row stays
--     'declined' and re-asking returns 'declined' rather than reopening,
--     so a refusal cannot be worn down by repetition.
--
-- What is added, because removing the gate removes a spam brake:
--   * a cap of 20 new requests per requester per rolling 24 hours.
--
-- Run in the Supabase SQL Editor after 0031.
-- =====================================================================

create index if not exists contact_requests_requester_created_idx
  on public.contact_requests (requester_id, created_at desc);

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
begin
  if me is null then raise exception 'Not authenticated'; end if;
  if other_id is null or other_id = me then raise exception 'Invalid request'; end if;

  -- Blocks remain absolute, in both directions.
  if exists (
    select 1 from public.blocks
    where (blocker_id = me and blocked_id = other_id)
       or (blocker_id = other_id and blocked_id = me)
  ) then
    raise exception 'Cannot contact this user';
  end if;

  -- The match requirement from 0029 is intentionally gone.

  -- Spam brake: 20 new requests per rolling 24h.
  select count(*) into recent
  from public.contact_requests
  where requester_id = me and created_at > now() - interval '24 hours';
  if recent >= 20 then
    raise exception 'Too many requests today. Try again tomorrow.';
  end if;

  -- A previous decline is preserved by the unique constraint: this is a
  -- no-op and the caller gets 'declined' back.
  insert into public.contact_requests (requester_id, target_id)
  values (me, other_id)
  on conflict (requester_id, target_id) do nothing;

  select status into st
  from public.contact_requests
  where requester_id = me and target_id = other_id;
  return st;
end $$;

grant execute on function public.request_whatsapp(uuid) to authenticated;
