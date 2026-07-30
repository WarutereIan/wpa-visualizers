alter table public.query_definitions
  add column if not exists computed_fields jsonb not null default '[]'::jsonb;

comment on column public.query_definitions.computed_fields is
  'Post-aggregation formulas: { id, alias, expression }[]';
