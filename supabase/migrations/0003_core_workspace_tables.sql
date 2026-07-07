-- DIMES-BI — Phase B core workspace tables
-- query_definitions, dashboards, mappings, user_preferences, dashboard_view_states,
-- organization_invites. Also adds the indicator_values.source_query_id FK.
-- Depends on 0001 (organizations, profiles, members) and 0002 (data_tables, indicator_values).

-- ---------------------------------------------------------------------------
-- query_definitions
-- ---------------------------------------------------------------------------
create table if not exists public.query_definitions (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  table_id         uuid not null references public.data_tables(id) on delete cascade,
  name             text not null,
  selected_columns text[] not null default '{}',
  filters          jsonb not null default '[]'::jsonb,    -- DataFilter[]
  group_by         text[] not null default '{}',
  aggregations     jsonb not null default '[]'::jsonb,    -- QueryAggregation[]
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index on public.query_definitions (organization_id);
create index on public.query_definitions (table_id);
create trigger query_definitions_set_updated_at
  before update on public.query_definitions
  for each row execute function public.set_updated_at();

-- Wire indicator_values.source_query_id (created in 0002 without a FK).
do $$ begin
  alter table public.indicator_values
    add constraint indicator_values_source_query_id_fkey
    foreign key (source_query_id) references public.query_definitions(id) on delete set null;
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- dashboards (layout + widgets stored as jsonb; widgets reference queries via dataSourceId)
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.dashboard_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null; end $$;

create table if not exists public.dashboards (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id      uuid,                                  -- FK added in 0004
  name            text not null,
  description     text,
  layout          jsonb not null default '[]'::jsonb,    -- react-grid-layout Layout[]
  widgets         jsonb not null default '{}'::jsonb,    -- Record<widgetId, WidgetConfig>
  status          public.dashboard_status not null default 'draft',
  version         int not null default 1,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index on public.dashboards (organization_id);
create trigger dashboards_set_updated_at
  before update on public.dashboards
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- mappings (geographic views: dataset-backed or iframe)
-- ---------------------------------------------------------------------------
create table if not exists public.mappings (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  name             text not null,
  description      text not null default '',
  source           text not null check (source in ('dataset_table','external_url','baseline_embed')),
  data_table_id    uuid references public.data_tables(id) on delete set null,
  latitude_column  text,
  longitude_column text,
  label_column     text,
  external_map_url text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index on public.mappings (organization_id);
create trigger mappings_set_updated_at
  before update on public.mappings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- user_preferences (theme, selected project, sidebar) — replaces localStorage bits
-- ---------------------------------------------------------------------------
create table if not exists public.user_preferences (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  organization_id      uuid references public.organizations(id) on delete cascade,
  theme                text not null default 'auto' check (theme in ('light','dark','auto')),
  selected_project_id  uuid,                              -- FK added in 0004
  sidebar_collapsed    boolean not null default false,
  updated_at           timestamptz not null default now()
);

create trigger user_preferences_set_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- dashboard_view_states — per-user filters on a dashboard (today: in-memory only)
-- ---------------------------------------------------------------------------
create table if not exists public.dashboard_view_states (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  dashboard_id uuid not null references public.dashboards(id) on delete cascade,
  filters      jsonb not null default '{}'::jsonb,        -- GlobalDashboardFilters + widget filters
  updated_at   timestamptz not null default now(),
  unique (user_id, dashboard_id)
);

create trigger dashboard_view_states_set_updated_at
  before update on public.dashboard_view_states
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- organization_invites (Phase A invite flow — placed here to avoid editing 0001)
-- ---------------------------------------------------------------------------
create table if not exists public.organization_invites (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email           text not null,
  role            text not null default 'viewer'
                  check (role in ('owner','admin','editor','viewer','partner','guest')),
  token           text not null unique,
  invited_by      uuid not null references auth.users(id),
  accepted_by     uuid references auth.users(id),
  status          text not null default 'pending'
                  check (status in ('pending','accepted','revoked')),
  expires_at      timestamptz,
  created_at      timestamptz not null default now()
);

create index on public.organization_invites (organization_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.query_definitions     enable row level security;
alter table public.dashboards            enable row level security;
alter table public.mappings              enable row level security;
alter table public.user_preferences      enable row level security;
alter table public.dashboard_view_states enable row level security;
alter table public.organization_invites  enable row level security;

-- query_definitions
create policy "qdef: org members read"
  on public.query_definitions for select
  using (public.is_org_member(organization_id));
create policy "qdef: editors+ write"
  on public.query_definitions for all
  using (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'))
  with check (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'));

-- dashboards
create policy "dashboards: org members read"
  on public.dashboards for select
  using (public.is_org_member(organization_id));
create policy "dashboards: editors+ write"
  on public.dashboards for all
  using (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'))
  with check (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'));

-- mappings
create policy "mappings: org members read"
  on public.mappings for select
  using (public.is_org_member(organization_id));
create policy "mappings: editors+ write"
  on public.mappings for all
  using (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'))
  with check (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'));

-- user_preferences: self only
create policy "prefs: self read"
  on public.user_preferences for select using (auth.uid() = user_id);
create policy "prefs: self write"
  on public.user_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- dashboard_view_states: self only
create policy "view_states: self read"
  on public.dashboard_view_states for select using (auth.uid() = user_id);
create policy "view_states: self write"
  on public.dashboard_view_states for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- organization_invites: org members read; admins+ manage
create policy "invites: org members read"
  on public.organization_invites for select
  using (public.is_org_member(organization_id));
create policy "invites: admins+ manage"
  on public.organization_invites for all
  using (public.current_org_role(organization_id) in ('owner','admin'))
  with check (public.current_org_role(organization_id) in ('owner','admin'));

comment on table public.query_definitions     is 'Saved queries from the query builder. filters/aggregations/group_by mirror src/types/data.ts QueryDefinition.';
comment on table public.dashboards            is 'Dashboard definitions; layout + widgets as jsonb. Widget.dataSourceId references query_definitions.id inside the widgets jsonb.';
comment on table public.mappings              is 'Geographic views — dataset-backed (Leaflet) or external iframe. Mirrors src/types/mapping.ts MappingDefinition.';
comment on table public.user_preferences      is 'Per-user UI state (theme, selected project, sidebar) — replaces localStorage theme + outputsIndicatorsStore.selectedProjectId.';
comment on table public.dashboard_view_states is 'Per-user filter state for a dashboard view (today only in-memory in dashboardFilterStore).';
comment on table public.organization_invites  is 'Pending/accepted invitations to an organization.';
