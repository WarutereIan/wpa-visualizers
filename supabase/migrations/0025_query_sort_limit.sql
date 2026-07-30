-- Query sort + row limit (pipeline rebuild Phase 3)
alter table public.query_definitions
  add column if not exists sort jsonb not null default '[]'::jsonb;

alter table public.query_definitions
  add column if not exists row_limit integer null;

comment on column public.query_definitions.sort is
  'QuerySort[] — order result rows by result column names';
comment on column public.query_definitions.row_limit is
  'Optional max rows after aggregation/sort (null = no limit)';
