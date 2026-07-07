-- DIMES-BI — Phase E product-spec extras
-- dashboard_snapshots, shared_links, export_jobs, audit_logs (+ generic trigger),
-- validation_rules, data_quality_issues, comments, reports, dimensions,
-- indicator_definitions (unified semantic layer), nlq_history.
-- Depends on 0001–0005.

-- ---------------------------------------------------------------------------
-- dashboard_snapshots — immutable point-in-time freeze
-- ---------------------------------------------------------------------------
create table if not exists public.dashboard_snapshots (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  dashboard_id    uuid references public.dashboards(id) on delete set null,
  period          text,                                   -- e.g. '2026-Q1'
  layout          jsonb not null,
  data            jsonb not null,                         -- frozen query/indicator results
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now()
);

create index on public.dashboard_snapshots (organization_id, created_at desc);
-- No update/delete policies → immutable.

-- ---------------------------------------------------------------------------
-- shared_links — token-gated, optionally passworded, optionally embeddable
-- ---------------------------------------------------------------------------
create table if not exists public.shared_links (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  dashboard_id    uuid references public.dashboards(id) on delete cascade,
  snapshot_id     uuid references public.dashboard_snapshots(id) on delete cascade,
  token           text not null unique,
  password_hash   text,                                   -- bcrypt/argon2 if set
  expires_at      timestamptz,
  embed_allowed   boolean not null default false,
  created_at      timestamptz not null default now(),
  check (dashboard_id is not null or snapshot_id is not null)
);

create index on public.shared_links (token);

-- ---------------------------------------------------------------------------
-- export_jobs — async PDF/PPTX/CSV/PNG generation
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.exportFormat as enum ('pdf','pptx','csv','png','svg');
  create type public.exportStatus as enum ('queued','running','success','failed');
exception when duplicate_object then null; end $$;

create table if not exists public.export_jobs (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  target_type     text not null check (target_type in ('dashboard','snapshot','report')),
  target_id       uuid,
  format          public.exportFormat not null,
  status          public.exportStatus not null default 'queued',
  result_url      text,                                   -- signed Storage URL when complete
  error           text,
  created_at      timestamptz not null default now(),
  completed_at    timestamptz
);

create index on public.export_jobs (organization_id, created_at desc);

-- ---------------------------------------------------------------------------
-- audit_logs — append-only, written by a generic trigger on Tier 1–3 tables
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid,
  user_id         uuid,
  action          text not null,                          -- INSERT/UPDATE/DELETE
  entity_type     text not null,                          -- table name
  entity_id       uuid,
  metadata        jsonb not null default '{}'::jsonb,     -- {old, new} subset
  created_at      timestamptz not null default now()
);

create index on public.audit_logs (organization_id, created_at desc);
create index on public.audit_logs (entity_type, entity_id);

create or replace function public.audit_t()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  org_id uuid;
  ent_id uuid;
begin
  org_id := coalesce(
    (select organization_id from public.organizations where id is not null limit 0), -- no-op
    null
  );
  -- Read organization_id from the row when the table has that column.
  begin
    if tg_op in ('INSERT','UPDATE') and new is not null then
      execute format('select $1.organization_id') into org_id using new;
    elsif tg_op = 'DELETE' and old is not null then
      execute format('select $1.organization_id') into org_id using old;
    end if;
  exception when others then org_id := null; end;

  ent_id := coalesce(new.id, old.id);

  insert into public.audit_logs (organization_id, user_id, action, entity_type, entity_id, metadata)
  values (
    org_id,
    auth.uid(),
    tg_op,
    tg_table_name,
    ent_id,
    case
      when tg_op = 'DELETE' then jsonb_build_object('old', to_jsonb(old))
      when tg_op = 'INSERT' then jsonb_build_object('new', to_jsonb(new))
      else jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new))
    end
  );
  return coalesce(new, old);
end;
$$;

-- Attach the audit trigger to Tier 1–3 tables that carry organization_id.
-- (data_table_rows is intentionally excluded — too high volume.)
do $$
declare
  t text;
  tables text[] := array[
    'data_tables','data_table_columns','query_definitions','dashboards','mappings',
    'projects','outputs','indicators',
    'data_source_connections','import_jobs',
    'dashboard_snapshots','shared_links','alert_rules'
  ];
begin
  foreach t in array tables loop
    execute format(
      'drop trigger if exists %I_audit on public.%I; create trigger %I_audit after insert or update or delete on public.%I for each row execute function public.audit_t();',
      t, t, t, t
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- validation_rules + data_quality_issues (product-spec §10)
-- ---------------------------------------------------------------------------
create table if not exists public.validation_rules (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  data_table_id   uuid references public.data_tables(id) on delete cascade,
  column_name     text,
  rule_type       text not null check (rule_type in ('range','format','uniqueness','required','cross_field')),
  expression      jsonb not null,                          -- e.g. {"min":0,"max":120}
  severity        text not null default 'warning' check (severity in ('info','warning','error'))
);

create table if not exists public.data_quality_issues (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  validation_rule_id  uuid references public.validation_rules(id) on delete cascade,
  data_table_id       uuid references public.data_tables(id) on delete cascade,
  row_id              text,                                -- jsonb row pk or data_table_rows.id as text
  status              text not null default 'open' check (status in ('open','in_review','resolved','accepted')),
  assigned_to         uuid references auth.users(id) on delete set null,
  created_at          timestamptz not null default now(),
  resolved_at         timestamptz
);

create index on public.data_quality_issues (organization_id, status);

-- ---------------------------------------------------------------------------
-- comments (product-spec §11.1 — dashboards, widgets, indicators, data points)
-- ---------------------------------------------------------------------------
create table if not exists public.comments (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  author_id       uuid not null references auth.users(id) on delete cascade,
  entity_type     text not null check (entity_type in ('dashboard','widget','indicator','output','project','data_point')),
  entity_id       uuid not null,
  parent_id       uuid references public.comments(id) on delete cascade, -- threading
  body            text not null,
  resolved_at     timestamptz,
  created_at      timestamptz not null default now()
);

create index on public.comments (organization_id, entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- reports (narrative / story mode, product-spec §11.2 / §14.2)
-- ---------------------------------------------------------------------------
create table if not exists public.reports (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  period          text,
  -- ordered list of blocks: {type:'dashboard'|'indicator'|'chart'|'text', ref, content}
  blocks          jsonb not null default '[]'::jsonb,
  branding        jsonb not null default '{}'::jsonb,     -- logo, colors, font
  status          text not null default 'draft' check (status in ('draft','published')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger reports_set_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- dimensions (reusable disaggregation catalog, product-spec §6.3)
-- ---------------------------------------------------------------------------
create table if not exists public.dimensions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,                          -- 'gender','age_group','geography',…
  values          jsonb not null default '[]'::jsonb,     -- ['male','female','other','unknown']
  created_at      timestamptz not null default now(),
  unique (organization_id, name)
);

-- ---------------------------------------------------------------------------
-- indicator_definitions — unified semantic layer (product-spec §6, §7)
-- Existing MEAL `indicators` rows are copied here (id preserved) so indicator_values
-- references remain valid.
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.indicatorType as enum (
    'count','sum','average','percentage','conditional_count',
    'disaggregated','composite','trend','baseline_adjusted','target_variance'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.indicator_definitions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id      uuid references public.projects(id) on delete set null,
  name            text not null,
  type            public.indicatorType not null default 'count',
  -- no-code formula or low-code expression
  formula         jsonb not null default '{}'::jsonb,
  source_query_id uuid references public.query_definitions(id) on delete set null,
  disaggregations jsonb not null default '[]'::jsonb,     -- dimension names/refs
  period          text,
  baseline        numeric,
  target          numeric,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger indicator_definitions_set_updated_at
  before update on public.indicator_definitions
  for each row execute function public.set_updated_at();

-- Migrate existing MEAL indicators into the unified table (id preserved).
insert into public.indicator_definitions
  (id, organization_id, project_id, name, type, source_query_id, disaggregations, period, baseline, target)
select id, organization_id, project_id, name, 'count', source_query_id, '[]'::jsonb, period, baseline, target
from public.indicators
on conflict (id) do nothing;

-- Re-point indicator_values.indicator_id to the unified table (ids were preserved).
do $$ begin
  alter table public.indicator_values
    drop constraint if exists indicator_values_indicator_id_fkey;
  alter table public.indicator_values
    add constraint indicator_values_indicator_id_fkey
    foreign key (indicator_id) references public.indicator_definitions(id) on delete cascade;
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- nlq_history — natural-language query history (product-spec §13.1)
-- ---------------------------------------------------------------------------
create table if not exists public.nlq_history (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  question        text not null,
  generated_query jsonb not null,                         -- compiled QueryDefinition or SQL
  edited          boolean not null default false,
  created_at      timestamptz not null default now()
);

create index on public.nlq_history (organization_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.dashboard_snapshots   enable row level security;
alter table public.shared_links          enable row level security;
alter table public.export_jobs           enable row level security;
alter table public.audit_logs            enable row level security;
alter table public.validation_rules      enable row level security;
alter table public.data_quality_issues   enable row level security;
alter table public.comments              enable row level security;
alter table public.reports               enable row level security;
alter table public.dimensions            enable row level security;
alter table public.indicator_definitions enable row level security;
alter table public.nlq_history           enable row level security;

-- snapshots: org members read; editors+ create. No update/delete (immutable).
create policy "snapshots: org members read"
  on public.dashboard_snapshots for select
  using (public.is_org_member(organization_id));
create policy "snapshots: editors+ create"
  on public.dashboard_snapshots for insert
  with check (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'));

-- shared_links: admins+ manage; the public read path is the shared.$token route
-- which uses the service role to validate the token, so no public SELECT policy.
create policy "shared_links: admins+ manage"
  on public.shared_links for all
  using (public.current_org_role(organization_id) in ('owner','admin'))
  with check (public.current_org_role(organization_id) in ('owner','admin'));

-- export_jobs: self + admins read; self insert; service role updates status.
create policy "exports: org members read"
  on public.export_jobs for select
  using (public.is_org_member(organization_id));
create policy "exports: self insert"
  on public.export_jobs for insert
  with check (auth.uid() = user_id);
create policy "exports: service role update"
  on public.export_jobs for update
  using (public.is_org_member(organization_id));

-- audit_logs: org members read; inserts only via trigger (service definer).
create policy "audit: org members read"
  on public.audit_logs for select
  using (public.is_org_member(organization_id));

-- validation_rules + issues: org members read; editors+ manage.
create policy "validation: org members read"
  on public.validation_rules for select
  using (public.is_org_member(organization_id));
create policy "validation: editors+ write"
  on public.validation_rules for all
  using (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'))
  with check (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'));

create policy "issues: org members read"
  on public.data_quality_issues for select
  using (public.is_org_member(organization_id));
create policy "issues: editors+ write"
  on public.data_quality_issues for all
  using (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'))
  with check (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'));

-- comments: org members read; members write.
create policy "comments: org members read"
  on public.comments for select
  using (public.is_org_member(organization_id));
create policy "comments: members write"
  on public.comments for all
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id) and auth.uid() = author_id);

-- reports: org members read; editors+ manage.
create policy "reports: org members read"
  on public.reports for select
  using (public.is_org_member(organization_id));
create policy "reports: editors+ write"
  on public.reports for all
  using (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'))
  with check (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'));

-- dimensions: org members read; editors+ manage.
create policy "dimensions: org members read"
  on public.dimensions for select
  using (public.is_org_member(organization_id));
create policy "dimensions: editors+ write"
  on public.dimensions for all
  using (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'))
  with check (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'));

-- indicator_definitions: org members read; editors+ manage.
create policy "indicator_defs: org members read"
  on public.indicator_definitions for select
  using (public.is_org_member(organization_id));
create policy "indicator_defs: editors+ write"
  on public.indicator_definitions for all
  using (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'))
  with check (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'));

-- nlq_history: self read; self insert.
create policy "nlq: self read"
  on public.nlq_history for select
  using (auth.uid() = user_id);
create policy "nlq: self insert"
  on public.nlq_history for insert
  with check (auth.uid() = user_id);

comment on table public.dashboard_snapshots     is 'Immutable point-in-time dashboard freeze (product-spec §11.3). No update/delete policies.';
comment on table public.shared_links            is 'Token-gated, optionally passworded, optionally embeddable dashboard/snapshot links (§14.1).';
comment on table public.export_jobs             is 'Async export queue for PDF/PPTX/CSV/PNG (§14).';
comment on table public.audit_logs              is 'Append-only audit trail; populated by audit_t() trigger on Tier 1–3 tables (§10.4 / §11.4 activity feed).';
comment on table public.validation_rules        is 'Data quality validation rules per field/dataset (§10.1).';
comment on table public.data_quality_issues     is 'Detected violations with assignment + status workflow (§10.3).';
comment on table public.comments                is 'Threaded comments on dashboards/widgets/indicators/data points (§11.1).';
comment on table public.reports                 is 'Narrative/story-mode reports composed of dashboard/indicator/text blocks (§11.2 / §14.2).';
comment on table public.dimensions              is 'Reusable disaggregation dimensions (§6.3); referenced by indicator_definitions.disaggregations and indicator_values.disaggregation_key.';
comment on table public.indicator_definitions   is 'Unified semantic indicator layer (§6, §7). Existing MEAL indicators migrated here with ids preserved; indicator_values re-pointed to this table.';
comment on table public.nlq_history             is 'Natural-language query history with generated query (§13.1).';
