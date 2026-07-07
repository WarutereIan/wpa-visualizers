-- DIMES-BI — Phase B/D data storage layer (backend plan §8)
-- Virtual table catalog (data_tables, data_table_columns), jsonb row store
-- (data_table_rows), and the aggregate store (indicator_values).
-- No per-import DDL: dynamic schemas live in data_table_columns + Parquet footers.

-- ---------------------------------------------------------------------------
-- data_tables — metadata for every imported/modeled dataset
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.data_storage_backend as enum ('jsonb', 'parquet');
exception when duplicate_object then null; end $$;

create table if not exists public.data_tables (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id      uuid,                      -- optional project scoping (FK added in Phase C)
  name            text not null,
  storage_backend public.data_storage_backend not null default 'jsonb',
  row_count       bigint not null default 0, -- cached, used for billing + promotion checks
  source_connection_id uuid,                 -- FK to data_source_connections added in Phase D
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, name)
);

create index on public.data_tables (organization_id);
create trigger data_tables_set_updated_at
  before update on public.data_tables
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- data_table_columns — virtual schema catalog (one row per column per table)
-- Single source of truth for the query compiler and UI, regardless of whether
-- rows live in data_table_rows (jsonb) or Parquet.
-- ---------------------------------------------------------------------------
create table if not exists public.data_table_columns (
  id              uuid primary key default gen_random_uuid(),
  data_table_id   uuid not null references public.data_tables(id) on delete cascade,
  name            text not null,             -- raw column name as it appears in source
  display_name    text,                      -- optional semantic label
  data_type       text not null              -- 'string' | 'number' | 'boolean'
                  check (data_type in ('string','number','boolean')),
  ordinal         int  not null default 0,
  is_indexed      boolean not null default false, -- hint to promote to expression index
  created_at      timestamptz not null default now(),
  unique (data_table_id, name)
);

create index on public.data_table_columns (data_table_id);

-- ---------------------------------------------------------------------------
-- data_table_rows — jsonb backend (small datasets, ≲ ~50k rows)
-- Large datasets are promoted to the parquet backend (Supabase Storage).
-- ---------------------------------------------------------------------------
create table if not exists public.data_table_rows (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  data_table_id   uuid not null references public.data_tables(id) on delete cascade,
  row_data        jsonb not null,
  created_at      timestamptz not null default now()
);

create index data_table_rows_org_table_idx
  on public.data_table_rows (organization_id, data_table_id);
create index data_table_rows_data_gin
  on public.data_table_rows using gin (row_data);

-- Template for per-column expression indexes (run from a service-role function
-- when is_indexed is flagged or query latency demands it):
--   create index on public.data_table_rows ((row_data->>'district'))
--     where data_table_id = '<uuid>';
-- And typed generated columns for heavy numeric/group-by use:
--   alter table public.data_table_rows
--     add column age numeric generated always as ((row_data->>'age')::numeric) stored;

-- ---------------------------------------------------------------------------
-- indicator_values — aggregate store (product-spec §16.2, plan §8.5)
-- Pre-computed indicator results for <3s dashboard loads.
-- ---------------------------------------------------------------------------
create table if not exists public.indicator_values (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  indicator_id      uuid not null,           -- FK to indicators added in Phase C
  period            text not null,           -- e.g. '2026-Q1'
  disaggregation_key jsonb not null default '{}'::jsonb,
  value             numeric,
  row_count         int,
  source_query_id   uuid,                    -- FK to query_definitions added in Phase B
  computed_at       timestamptz not null default now(),
  unique (indicator_id, period, disaggregation_key)
);

create index indicator_values_lookup_idx
  on public.indicator_values (organization_id, indicator_id, period);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.data_tables          enable row level security;
alter table public.data_table_columns   enable row level security;
alter table public.data_table_rows      enable row level security;
alter table public.indicator_values     enable row level security;

create policy "data_tables: org members read"
  on public.data_tables for select
  using (public.is_org_member(organization_id));

create policy "data_tables: editors+ write"
  on public.data_tables for all
  using (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'))
  with check (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'));

create policy "data_table_columns: org members read"
  on public.data_table_columns for select
  using (public.is_org_member(
    (select dt.organization_id from public.data_tables dt where dt.id = data_table_id)
  ));

create policy "data_table_columns: editors+ write"
  on public.data_table_columns for all
  using (public.current_org_role(
    (select dt.organization_id from public.data_tables dt where dt.id = data_table_id)
  ) in ('owner','admin','editor','data_manager'))
  with check (public.current_org_role(
    (select dt.organization_id from public.data_tables dt where dt.id = data_table_id)
  ) in ('owner','admin','editor','data_manager'));

create policy "data_table_rows: org members read"
  on public.data_table_rows for select
  using (public.is_org_member(organization_id));

create policy "data_table_rows: service role / editors+ write"
  on public.data_table_rows for insert
  with check (public.is_org_member(organization_id));

create policy "data_table_rows: editors+ update/delete"
  on public.data_table_rows for update
  using (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'));
create policy "data_table_rows: editors+ delete"
  on public.data_table_rows for delete
  using (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'));

create policy "indicator_values: org members read"
  on public.indicator_values for select
  using (public.is_org_member(organization_id));

create policy "indicator_values: service role writes"
  on public.indicator_values for all
  using (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'))
  with check (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'));

-- ---------------------------------------------------------------------------
-- promote_storage_backend(table_id uuid, target data_storage_backend)
-- Flips storage_backend and refreshes row_count. The actual Parquet write is
-- performed by the ingestion worker (Edge Function) BEFORE this is called;
-- this function only commits the catalog change once the Parquet landing succeeds.
-- ---------------------------------------------------------------------------
create or replace function public.promote_storage_backend(
  target_table uuid,
  target public.data_storage_backend
)
returns public.data_storage_backend
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count bigint;
begin
  if target = 'jsonb' then
    select count(*) into new_count
    from public.data_table_rows
    where data_table_id = target_table;
  else
    new_count := (select row_count from public.data_tables where id = target_table);
  end if;

  update public.data_tables
     set storage_backend = target,
         row_count = coalesce(new_count, row_count),
         updated_at = now()
   where id = target_table;

  return target;
end;
$$;

comment on table public.data_tables         is 'Metadata for every imported/modeled dataset. storage_backend selects where rows physically live (jsonb in Postgres, or Parquet in Supabase Storage).';
comment on table public.data_table_columns  is 'Virtual schema catalog — single source of truth for the query compiler and UI, regardless of row storage backend.';
comment on table public.data_table_rows     is 'jsonb row store for small datasets (≲ ~50k rows). Large datasets are promoted to the parquet backend.';
comment on table public.indicator_values    is 'Aggregate store: pre-computed indicator values by period and disaggregation, refreshed after each sync.';
