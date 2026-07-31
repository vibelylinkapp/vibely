-- =====================================================================
-- Vibely - WhatsApp number sharing between matches (0029)
-- Members keep a private WhatsApp number. After two people match, either can
-- ASK the other for their number; the other APPROVES; only then is it revealed.
-- The number is never exposed via a normal profiles read.
--
--   * member_contacts  - the private number (owner-only RLS)
--   * contact_requests - one member asking another (both parties can read)
--   * request_whatsapp / respond_whatsapp / get_shared_whatsapp - the flow,
--     as SECURITY DEFINER RPCs enforcing match + approval.
-- Run in the Supabase SQL Editor after 0028.
-- =====================================================================

-- Private contact details. Only the owner can read or write their own row;
-- there is deliberately no policy that lets anyone else read it.
create table if not exists public.member_contacts (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  whatsapp   text,
  updated_at timestamptz not null default now()
);

alter table public.member_contacts enable row level security;

drop policy if exists member_contacts_own on public.member_contacts;
create policy member_contacts_own on public.member_contacts
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Seed from the phone people registered with (if any).
insert into public.member_contacts (profile_id, whatsapp)
select id, phone from public.profiles where phone is not null
on conflict (profile_id) do nothing;

-- A request from one member to another to share WhatsApp.
create table if not exists public.contact_requests (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  target_id    uuid not null references public.profiles(id) on delete cascade,
  status       text not null default 'pending'
                 check (status in ('pending', 'approved', 'declined')),
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  unique (requester_id, target_id)
);
create index if not exists contact_requests_target_idx
  on public.contact_requests (target_id, status);

alter table public.contact_requests enable row level security;

-- Both the requester and the target can see the request; all writes are via
-- the RPCs below (no direct insert/update policy).
drop policy if exists contact_requests_read on public.contact_requests;
create policy contact_requests_read on public.contact_requests
  for select to authenticated
  using (requester_id = auth.uid() or target_id = auth.uid());

-- Ask a match for their WhatsApp number.
create or replace function public.request_whatsapp(other_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  st text;
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
  if not exists (
    select 1
    from public.likes l1
    join public.likes l2 on l1.liker_id = l2.liked_id and l1.liked_id = l2.liker_id
    where l1.liker_id = me and l1.liked_id = other_id
  ) then
    raise exception 'You can only request WhatsApp from a match';
  end if;

  insert into public.contact_requests (requester_id, target_id)
  values (me, other_id)
  on conflict (requester_id, target_id) do nothing;

  select status into st
  from public.contact_requests
  where requester_id = me and target_id = other_id;
  return st;
end $$;

-- Target approves or declines a request from from_id.
create or replace function public.respond_whatsapp(from_id uuid, approve boolean)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  st text;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  update public.contact_requests
    set status = case when approve then 'approved' else 'declined' end,
        responded_at = now()
    where requester_id = from_id and target_id = me and status = 'pending';
  select status into st
  from public.contact_requests
  where requester_id = from_id and target_id = me;
  return st;
end $$;

-- Reveal the other member's WhatsApp, but only if they approved my request.
create or replace function public.get_shared_whatsapp(other_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  num text;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  if not exists (
    select 1 from public.contact_requests
    where requester_id = me and target_id = other_id and status = 'approved'
  ) then
    return null;
  end if;
  select whatsapp into num from public.member_contacts where profile_id = other_id;
  return num;
end $$;

grant execute on function public.request_whatsapp(uuid) to authenticated;
grant execute on function public.respond_whatsapp(uuid, boolean) to authenticated;
grant execute on function public.get_shared_whatsapp(uuid) to authenticated;
