-- Vibely — Swipe deck: persistent passes
-- Remembers who a member has passed (left-swiped) in the Nearby swipe deck so
-- they don't reappear across sessions. Mirrors the existing "likes" table.
--
-- Run ONCE in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Idempotent and safe to re-run.

create table if not exists public.passes (
  passer_id  uuid not null references public.profiles (id) on delete cascade,
  passed_id  uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (passer_id, passed_id)
);

create index if not exists passes_passer_id_idx on public.passes (passer_id);

alter table public.passes enable row level security;

-- You can only read / create / delete your own passes.
drop policy if exists "passes_select" on public.passes;
create policy "passes_select" on public.passes
  for select to authenticated
  using (passer_id = auth.uid());

drop policy if exists "passes_insert" on public.passes;
create policy "passes_insert" on public.passes
  for insert to authenticated
  with check (passer_id = auth.uid());

drop policy if exists "passes_delete" on public.passes;
create policy "passes_delete" on public.passes
  for delete to authenticated
  using (passer_id = auth.uid());
