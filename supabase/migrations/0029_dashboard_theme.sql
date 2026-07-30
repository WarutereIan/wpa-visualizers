-- Dashboard-level visual theme (palette applies to canvas + all widgets).
alter table public.dashboards
  add column if not exists theme jsonb not null default '{"paletteId":"lagoon"}'::jsonb;

comment on column public.dashboards.theme is
  'Dashboard visual theme, e.g. {"paletteId":"lagoon"|"ocean"|"sunset"|"forest"|"mono"}.';
