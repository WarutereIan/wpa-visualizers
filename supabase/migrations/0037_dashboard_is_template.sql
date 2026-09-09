-- Dashboard templates: mark dashboards that are reusable starting points.
alter table public.dashboards
  add column if not exists is_template boolean not null default false;

create index if not exists dashboards_org_template_idx
  on public.dashboards (organization_id, is_template)
  where is_template = true;
