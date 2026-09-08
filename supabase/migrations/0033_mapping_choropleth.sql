-- GIS choropleth: allow choropleth mappings; store extra fields in jsonb options.
-- Existing mappings schema is column-strict (source check + dedicated lat/lng/url columns).

alter table public.mappings
  drop constraint if exists mappings_source_check;

alter table public.mappings
  add constraint mappings_source_check
  check (source in ('dataset_table','external_url','baseline_embed','choropleth'));

alter table public.mappings
  add column if not exists options jsonb not null default '{}'::jsonb;

comment on column public.mappings.options is
  'Source-specific extras. Choropleth: queryId, visualizationId, mapType, keyColumn, valueColumn, targetField.';

comment on table public.mappings is
  'Geographic views — dataset-backed (Leaflet), external iframe, baseline embed, or choropleth (redash Renderer).';
