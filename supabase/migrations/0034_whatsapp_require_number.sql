-- =====================================================================
-- Vibely - Require a number before approving (0034)
--
-- respond_whatsapp let anyone approve a request, including members who
-- have never saved a WhatsApp number. Approving flips the row to
-- 'approved' permanently, and get_shared_whatsapp then returns null,
-- so the asker is told the number "hasn't been added yet" and the
-- request is spent. The approver is never told they needed a number.
--
-- At the time of writing only 2 of 5 real members had a number saved,
-- so this was the likely outcome rather than an edge case.
--
-- Approving without a number now returns 'no_number' and leaves the
-- request pending, so it can still be approved for real once a number
-- is added. Declines are unaffected - a member must always be able to
-- refuse, whether or not they have a number on file.
--
-- Carries forward the approval notification added in 0033.
-- Run in the Supabase SQL Editor after 0033.
-- =====================================================================

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
  mine    text;
begin
  if me is null then raise exception 'Not authenticated'; end if;

  -- Approving is only meaningful if there is something to reveal.
  if approve then
    select nullif(btrim(coalesce(whatsapp, '')), '')
      into mine
      from public.member_contacts
     where profile_id = me;

    if mine is null then
      return 'no_number';
    end if;
  end if;

  update public.contact_requests
    set status = case when approve then 'approved' else 'declined' end,
        responded_at = now()
    where requester_id = from_id and target_id = me and status = 'pending';
  get diagnostics changed = row_count;

  -- From 0033: approvals notify the asker, declines stay silent.
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

grant execute on function public.respond_whatsapp(uuid, boolean) to authenticated;
