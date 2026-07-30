-- =====================================================================
-- Vibely — Identity verification (0007)
-- Members submit a selfie (plus an ID/passport for the higher tiers).
-- Admins review in /admin/verifications and set profiles.verification,
-- which flips the generated is_verified flag. Run after 0006_push.sql.
-- =====================================================================
do $$ begin
  create type verif_status_t as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

create table if not exists public.verification_requests (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  kind        verification_t not null,       -- selfie | national_id | passport
  selfie_path text not null,                 -- path in private 'verifications' bucket
  doc_path    text,                          -- ID/passport image (higher tiers)
  status      verif_status_t not null default 'pending',
  note        text,                          -- admin note / rejection reason
  reviewed_by uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists verif_requests_status_idx
  on public.verification_requests (status, created_at desc);
create index if not exists verif_requests_profile_idx
  on public.verification_requests (profile_id);

alter table public.verification_requests enable row level security;

-- Members manage their own requests; admins review via the service role.
drop policy if exists verif_insert_own on public.verification_requests;
create policy verif_insert_own on public.verification_requests
  for insert to authenticated with check (profile_id = auth.uid());

drop policy if exists verif_select_own on public.verification_requests;
create policy verif_select_own on public.verification_requests
  for select to authenticated using (profile_id = auth.uid());

-- =====================================================================
-- Private storage bucket for verification images (NOT public).
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('verifications', 'verifications', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = 10485760,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Each member may write/read only inside their own uid folder.
-- Admins read via the service role (bypasses these policies) to review.
drop policy if exists "verif_insert_own_obj" on storage.objects;
create policy "verif_insert_own_obj"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'verifications'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "verif_select_own_obj" on storage.objects;
create policy "verif_select_own_obj"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'verifications'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "verif_delete_own_obj" on storage.objects;
create policy "verif_delete_own_obj"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'verifications'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
