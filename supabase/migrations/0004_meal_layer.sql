-- DIMES-BI — Phase C MEAL layer
-- projects, outputs, indicators, output_indicator_links.
-- Adds deferred FKs: data_tables.project_id, dashboards.project_id,
-- user_preferences.selected_project_id, indicator_values.indicator_id.
-- Depends on 0001, 0002, 0003.

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code            text,
  name            text not null,
  program         text,                                   -- aligns with demo Households.program
  description     text not null default '',
  status          text not null default 'in_progress'
                  check (status in ('planned','in_progress','completed','at_risk')),
  start_date      date,
  end_date        date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index on public.projects (organization_id);
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- outputs
-- ---------------------------------------------------------------------------
create table if not exists public.outputs (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  title         text not null,
  description   text not null default '',
  status        text not null default 'planned'
                check (status in ('planned','in_progress','completed','at_risk')),
  district      text,
  target_period text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index on public.outputs (project_id);
create trigger outputs_set_updated_at
  before update on public.outputs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- indicators (MEAL catalog — distinct from imported tbl-indicators datasets)
-- ---------------------------------------------------------------------------
create table if not exists public.indicators (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id      uuid not null references public.projects(id) on delete cascade,
  name            text not null,
  location        text,
  unit            text,
  baseline        numeric,
  target          numeric,
  current         numeric,                                -- populated by compute-indicator-current
  period          text,                                   -- e.g. '2026-Q1'
  source_query_id uuid references public.query_definitions(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index on public.indicators (organization_id);
create index on public.indicators (project_id);
create trigger indicators_set_updated_at
  before update on public.indicators
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- output_indicator_links (M:N)
-- ---------------------------------------------------------------------------
create table if not exists public.output_indicator_links (
  output_id    uuid not null references public.outputs(id) on delete cascade,
  indicator_id uuid not null references public.indicators(id) on delete cascade,
  weight       numeric not null default 1,
  note         text,
  primary key (output_id, indicator_id)
);

-- ---------------------------------------------------------------------------
-- Deferred FKs from earlier migrations
-- ---------------------------------------------------------------------------
do $$ begin
  alter table public.data_tables
    add constraint data_tables_project_id_fkey
    foreign key (project_id) references public.projects(id) on delete set null;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.dashboards
    add constraint dashboards_project_id_fkey
    foreign key (project_id) references public.projects(id) on delete set null;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.user_preferences
    add constraint user_preferences_selected_project_id_fkey
    foreign key (selected_project_id) references public.projects(id) on delete set null;
exception when duplicate_object then null; end $$;

-- indicator_values.indicator_id → indicators (created in 0002 without FK)
do $$ begin
  alter table public.indicator_values
    add constraint indicator_values_indicator_id_fkey
    foreign key (indicator_id) references public.indicators(id) on delete cascade;
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.projects                enable row level security;
alter table public.outputs                 enable row level security;
alter table public.indicators              enable row level security;
alter table public.output_indicator_links  enable row level security;

create policy "projects: org members read"
  on public.projects for select
  using (public.is_org_member(organization_id));
create policy "projects: editors+ write"
  on public.projects for all
  using (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'))
  with check (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'));

-- outputs inherit scope via projects.organization_id
create policy "outputs: org members read"
  on public.outputs for select
  using (public.is_org_member(
    (select p.organization_id from public.projects p where p.id = project_id)
  ));
create policy "outputs: editors+ write"
  on public.outputs for all
  using (public.current_org_role(
    (select p.organization_id from public.projects p where p.id = project_id)
  ) in ('owner','admin','editor','data_manager'))
  with check (public.current_org_role(
    (select p.organization_id from public.projects p where p.id = project_id)
  ) in ('owner','admin','editor','data_manager'));

-- indicators carry organization_id directly
create policy "indicators: org members read"
  on public.indicators for select
  using (public.is_org_member(organization_id));
create policy "indicators: editors+ write"
  on public.indicators for all
  using (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'))
  with check (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'));

-- links inherit via outputs → projects
create policy "links: org members read"
  on public.output_indicator_links for select
  using (public.is_org_member(
    (select p.organization_id
       from public.outputs o
       join public.projects p on p.id = o.project_id
      where o.id = output_id)
  ));
create policy "links: editors+ write"
  on public.output_indicator_links for all
  using (public.current_org_role(
    (select p.organization_id
       from public.outputs o
       join public.projects p on p.id = o.project_id
      where o.id = output_id)
  ) in ('owner','admin','editor','data_manager'))
  with check (public.current_org_role(
    (select p.organization_id
       from public.outputs o
       join public.projects p on p.id = o.project_id
      where o.id = output_id)
  ) in ('owner','admin','editor','data_manager'));

comment on table public.projects               is 'MEAL projects/programs. Mirrors src/types/outputsIndicators.ts WpaProject.';
comment on table public.outputs                is 'Project outputs. Mirrors WpaOutput (status, district, target_period).';
comment on table public.indicators             is 'MEAL indicator catalog with baseline/target/current. Mirrors WpaIndicator; source_query_id links to a saved query for computed current.';
comment on table public.output_indicator_links is 'M:N output↔indicator with weight + note. Contribution math stays derived (outputIndicatorMath.ts).';
