-- Phase D: Supabase Storage bucket for Parquet datasets + org-scoped access policies.
-- Path convention: orgs/{org_id}/tables/{table_id}/data/*.parquet

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dimes-data',
  'dimes-data',
  false,
  524288000,
  array['application/octet-stream', 'application/vnd.apache.parquet']
)
on conflict (id) do nothing;

-- Org members may read Parquet objects for their organization prefix.
create policy "dimes-data: org members read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'dimes-data'
    and (storage.foldername(name))[1] = 'orgs'
    and public.is_org_member(((storage.foldername(name))[2])::uuid)
  );

-- Service role (edge functions / worker) writes via service key — no insert policy for authenticated users.
