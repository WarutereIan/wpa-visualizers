-- Phase E: export storage bucket + atomic job claim for export worker.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dimes-exports',
  'dimes-exports',
  false,
  104857600,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/csv',
    'image/png'
  ]
)
on conflict (id) do nothing;

create policy "dimes-exports: org members read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'dimes-exports'
    and (storage.foldername(name))[1] = 'orgs'
    and public.is_org_member(((storage.foldername(name))[2])::uuid)
  );

-- Atomically claim the oldest queued export job (SKIP LOCKED).
create or replace function public.claim_export_job()
returns public.export_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed public.export_jobs;
begin
  update public.export_jobs
     set status = 'running'
   where id = (
     select id
       from public.export_jobs
      where status = 'queued'
      order by created_at
      limit 1
      for update skip locked
   )
  returning * into claimed;

  return claimed;
end;
$$;

revoke execute on function public.claim_export_job() from public;
grant execute on function public.claim_export_job() to service_role;

comment on function public.claim_export_job is
  'Claims one queued export_jobs row for the export worker (Phase E).';
