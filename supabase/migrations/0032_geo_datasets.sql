-- GIS choropleth: custom GeoJSON datasets + public storage bucket.
-- Path convention: orgs/{org_id}/{dataset_id}.geojson

create table public.geo_datasets (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references public.organizations(id) on delete cascade,
  name                 text not null,
  storage_path         text not null,
  public_url           text not null,
  default_target_field text not null default 'code',
  field_names          jsonb not null default '{}'::jsonb,
  feature_count        int not null default 0,
  byte_size            int not null default 0,
  created_by           uuid references auth.users(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index geo_datasets_org_idx on public.geo_datasets (organization_id);
create unique index geo_datasets_org_name_idx on public.geo_datasets (organization_id, name);

create trigger geo_datasets_set_updated_at
  before update on public.geo_datasets
  for each row execute function public.set_updated_at();

alter table public.geo_datasets enable row level security;

create policy "geo_datasets: org members read"
  on public.geo_datasets for select
  using (public.is_org_member(organization_id));

create policy "geo_datasets: editors+ write"
  on public.geo_datasets for all
  using (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'))
  with check (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'));

comment on table public.geo_datasets is 'Custom GeoJSON boundary datasets for choropleth maps (dimes-geo bucket).';

-- Public bucket for GeoJSON objects (stable URLs for map rendering).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dimes-geo',
  'dimes-geo',
  true,
  52428800,
  array['application/geo+json', 'application/json']
)
on conflict (id) do nothing;

create policy "dimes-geo: public read"
  on storage.objects for select
  to public
  using (bucket_id = 'dimes-geo');

create policy "dimes-geo: org members insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'dimes-geo'
    and (storage.foldername(name))[1] = 'orgs'
    and public.is_org_member(((storage.foldername(name))[2])::uuid)
  );

create policy "dimes-geo: org members update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'dimes-geo'
    and (storage.foldername(name))[1] = 'orgs'
    and public.is_org_member(((storage.foldername(name))[2])::uuid)
  )
  with check (
    bucket_id = 'dimes-geo'
    and (storage.foldername(name))[1] = 'orgs'
    and public.is_org_member(((storage.foldername(name))[2])::uuid)
  );

create policy "dimes-geo: org members delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'dimes-geo'
    and (storage.foldername(name))[1] = 'orgs'
    and public.is_org_member(((storage.foldername(name))[2])::uuid)
  );
