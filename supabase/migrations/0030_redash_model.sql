-- Redash-model tables: queries own visualizations; dashboards own widget rows.

create table public.visualizations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  query_id        uuid not null references public.query_definitions(id) on delete cascade,
  type            text not null check (type in (
    'CHART','TABLE','COUNTER','PIVOT','FUNNEL','SANKEY',
    'SUNBURST_SEQUENCE','MAP','CHOROPLETH','COHORT','WORD_CLOUD','DETAILS')),
  name            text not null,
  description     text,
  options         jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index visualizations_query_idx on public.visualizations (query_id);
create index visualizations_org_idx on public.visualizations (organization_id);

create table public.dashboard_widgets (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  dashboard_id     uuid not null references public.dashboards(id) on delete cascade,
  visualization_id uuid references public.visualizations(id) on delete cascade,
  text             text,
  options          jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint widget_is_viz_xor_text check (
    (visualization_id is not null and text is null)
    or (visualization_id is null and text is not null)
  )
);
create index dashboard_widgets_dashboard_idx on public.dashboard_widgets (dashboard_id);

create table public.favorites (
  user_id         uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  object_type     text not null check (object_type in ('dashboard','query')),
  object_id       uuid not null,
  created_at      timestamptz not null default now(),
  primary key (user_id, object_type, object_id)
);

alter table public.query_definitions add column parameters jsonb not null default '[]'::jsonb;
alter table public.dashboards add column tags text[] not null default '{}';
create index dashboards_tags_idx on public.dashboards using gin (tags);

alter table public.visualizations enable row level security;
alter table public.dashboard_widgets enable row level security;
alter table public.favorites enable row level security;

create policy "viz: org members read"
  on public.visualizations for select
  using (public.is_org_member(organization_id));
create policy "viz: editors+ write"
  on public.visualizations for all
  using (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'))
  with check (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'));

create policy "widgets: org members read"
  on public.dashboard_widgets for select
  using (public.is_org_member(organization_id));
create policy "widgets: editors+ write"
  on public.dashboard_widgets for all
  using (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'))
  with check (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'));

create policy "favorites: self read"
  on public.favorites for select using (auth.uid() = user_id);
create policy "favorites: self write"
  on public.favorites for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

comment on table public.visualizations is 'Redash-model: a query owns N visualizations (viz-lib options in options jsonb).';
comment on table public.dashboard_widgets is 'Redash-model: dashboard widget rows. visualization_id XOR text. options = { position, parameterMappings }.';
