-- =====================================================================
-- Vibely - Instant WhatsApp reveal for Gold and VIP (0046)
--
-- Members can opt in (member_contacts.allow_premium_reveal, off by
-- default) to let upgraded members see their WhatsApp number without
-- the ask-and-approve flow. Members who leave it off are unaffected:
-- the request/approve flow from 0029-0034 still applies to them.
--
-- reveal_whatsapp_premium returns the number, or one of:
--   'upgrade_required' - caller has no active Gold or VIP subscription
--   'not_shared'       - target has not opted in, or has no number
--   'blocked'          - either side has blocked the other
--
-- Run in the Supabase SQL Editor after 0045. Until it is run, the
-- "Reveal instantly with Gold" button reports that the feature is
-- unavailable and the opt-in toggle stays hidden. Nothing else breaks.
-- =====================================================================

alter table public.member_contacts
  add column if not exists allow_premium_reveal boolean not null default false;

create or replace function public.reveal_whatsapp_premium(other_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  me  uuid := auth.uid();
  num text;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  if other_id is null or other_id = me then raise exception 'Invalid request'; end if;

  if exists (
    select 1 from public.blocks
    where (blocker_id = me and blocked_id = other_id)
       or (blocker_id = other_id and blocked_id = me)
  ) then
    return 'blocked';
  end if;

  if not exists (
    select 1 from public.subscriptions
    where profile_id = me
      and status = 'active'
      and tier in ('gold', 'vip')
      and (expires_at is null or expires_at > now())
  ) then
    return 'upgrade_required';
  end if;

  select nullif(btrim(coalesce(whatsapp, '')), '')
    into num
    from public.member_contacts
   where profile_id = other_id
     and allow_premium_reveal;

  if num is null then
    return 'not_shared';
  end if;

  return num;
end $$;

revoke execute on function public.reveal_whatsapp_premium(uuid) from public, anon;
grant execute on function public.reveal_whatsapp_premium(uuid) to authenticated;
