-- Phase C/E follow-up: rename outputs.district → outputs.location (optional),
-- aligning the Output model with MEAL framework terminology (geographic/site
-- scope of an output). Backfills location from district, then drops district.

alter table public.outputs
  add column if not exists location text;

update public.outputs set location = coalesce(location, district);

alter table public.outputs
  drop column if exists district;

comment on column public.outputs.location is
  'Optional geographic/site scope for the output (MEAL framework). Replaces the legacy district column.';
