alter table public.query_definitions
  add column if not exists joins jsonb not null default '[]'::jsonb;

comment on column public.query_definitions.joins is
  'QueryJoin[] — optional multi-table joins before filter/group/agg';
