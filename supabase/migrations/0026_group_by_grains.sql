-- Optional date grains for group-by columns (pipeline Phase 5)
alter table public.query_definitions
  add column if not exists group_by_grains jsonb not null default '{}'::jsonb;

comment on column public.query_definitions.group_by_grains is
  'Map of group-by column → day|week|month|quarter|year';
