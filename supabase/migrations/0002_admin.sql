-- =====================================================================
-- Vibely — Admin & moderation migration (0002)
-- Run this in the Supabase SQL Editor AFTER 0001_init.sql.
-- =====================================================================

-- Admin + ban fields on profiles
alter table public.profiles add column if not exists is_admin       boolean not null default false;
alter table public.profiles add column if not exists is_banned      boolean not null default false;
alter table public.profiles add column if not exists banned_at      timestamptz;
alter table public.profiles add column if not exists banned_reason  text;

create index if not exists profiles_is_banned_idx on public.profiles (is_banned) where is_banned;

-- Audit log of moderation actions (written by the server via the service role only)
create table if not exists public.admin_actions (
  id         uuid primary key default gen_random_uuid(),
  admin_id   uuid references public.profiles(id) on delete set null,
  target_id  uuid references public.profiles(id) on delete set null,
  action     text not null,               -- 'ban' | 'unban' | 'dismiss_report'
  detail     text,
  created_at timestamptz not null default now()
);
alter table public.admin_actions enable row level security;
-- No client policies: only the service-role key (server side) reads/writes this table.

-- =====================================================================
-- >>> MAKE YOURSELF AN ADMIN <<<
-- This grants admin to mosesvibely@gmail.com. To add more admins later,
-- copy this statement and change the email. (Safe to re-run.)
-- Note: the account must have signed up in Vibely first (so it exists in
-- auth.users and has a profiles row) for this to take effect.
-- =====================================================================
update public.profiles
set is_admin = true
where id = (select id from auth.users where email = 'mosesvibely@gmail.com');
