-- DIMES-BI — Phase D BYOD operations + analytical query engine
-- data_source_connections, import_jobs, organization_usage, alert_rules, notifications.
-- Adds data_tables.source_connection_id FK.
-- Depends on 0001–0004.
--
-- NOTE on pg_cron: scheduling is set up out-of-band (requires superuser on Supabase
-- Cloud: `create extension pg_cron with schema extensions;` then grant usage). This
-- migration only prepares the data model; cron jobs are registered during deployment.

-- ---------------------------------------------------------------------------
-- data_source_connections — connector config; secrets live in Supabase Vault
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.connectionSourceType as enum (
    'kobo','excel','surveycto','dynamics365','google_forms',
    'google_sheets','microsoft_forms','csv','api'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.syncSchedule as enum ('manual','hourly','daily','weekly','realtime');
exception when duplicate_object then null; end $$;

create table if not exists public.data_source_connections (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  project_id          uuid references public.projects(id) on delete set null,
  source_type         public.connectionSourceType not null,
  name                text not null,
  endpoint_url        text,
  -- Vault secret id (vault.create_secret returns this). Never store plaintext creds.
  credentials_secret_id text,
  sync_schedule       public.syncSchedule not null default 'manual',
  schema_snapshot     jsonb,                              -- detected columns/types
  last_sync_at        timestamptz,
  last_sync_status    text check (last_sync_status in ('success','failed','partial','running')),
  last_error          text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index on public.data_source_connections (organization_id);
create trigger data_source_connections_set_updated_at
  before update on public.data_source_connections
  for each row execute function public.set_updated_at();

-- Wire data_tables.source_connection_id (created in 0002 without a FK).
do $$ begin
  alter table public.data_tables
    add constraint data_tables_source_connection_id_fkey
    foreign key (source_connection_id) references public.data_source_connections(id) on delete set null;
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- import_jobs — one row per sync run
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.importJobStatus as enum ('pending','running','success','failed','partial');
exception when duplicate_object then null; end $$;

create table if not exists public.import_jobs (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  connection_id   uuid references public.data_source_connections(id) on delete set null,
  source_type     public.connectionSourceType not null,
  status          public.importJobStatus not null default 'pending',
  row_count       bigint not null default 0,
  error_log       jsonb not null default '[]'::jsonb,
  result_table_id uuid references public.data_tables(id) on delete set null,
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz not null default now()
);

create index on public.import_jobs (organization_id, created_at desc);
create index on public.import_jobs (connection_id);

-- ---------------------------------------------------------------------------
-- organization_usage — monthly metering for plan limits
-- ---------------------------------------------------------------------------
create table if not exists public.organization_usage (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  month           text not null,                          -- 'YYYY-MM'
  rows_synced     bigint not null default 0,
  primary key (organization_id, month)
);

-- Increment helper (called by the ingestion worker after a successful import).
create or replace function public.bump_org_usage(org_id uuid, month_str text, delta bigint)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.organization_usage (organization_id, month, rows_synced)
  values (org_id, month_str, delta)
  on conflict (organization_id, month)
  do update set rows_synced = organization_usage.rows_synced + excluded.rows_synced;
$$;

-- ---------------------------------------------------------------------------
-- alert_rules + notifications (threshold alerts, product-spec §12.2 / §11.4)
-- ---------------------------------------------------------------------------
create table if not exists public.alert_rules (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  indicator_id    uuid references public.indicators(id) on delete cascade,
  name            text not null,
  -- e.g. {"op":"lt","threshold":80,"unit":"percent_of_target"}
  condition       jsonb not null,
  channel         text not null default 'in_app'
                  check (channel in ('in_app','email','teams','slack','whatsapp')),
  suppression_minutes int not null default 0,
  enabled         boolean not null default true,
  last_fired_at   timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index on public.alert_rules (organization_id);
create trigger alert_rules_set_updated_at
  before update on public.alert_rules
  for each row execute function public.set_updated_at();

create table if not exists public.notifications (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete cascade,
  alert_rule_id   uuid references public.alert_rules(id) on delete cascade,
  payload         jsonb not null default '{}'::jsonb,
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index on public.notifications (organization_id, created_at desc);
create index on public.notifications (user_id, read_at);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.data_source_connections enable row level security;
alter table public.import_jobs             enable row level security;
alter table public.organization_usage      enable row level security;
alter table public.alert_rules             enable row level security;
alter table public.notifications           enable row level security;

-- Connections: members read the row, but only admins/owners may read/use the
-- secret reference. The secret itself is only ever resolved server-side by the
-- ingestion worker (service role).
create policy "connections: org members read"
  on public.data_source_connections for select
  using (public.is_org_member(organization_id));
create policy "connections: admins+ write"
  on public.data_source_connections for all
  using (public.current_org_role(organization_id) in ('owner','admin','data_manager'))
  with check (public.current_org_role(organization_id) in ('owner','admin','data_manager'));

-- Optionally hide the secret id from non-admins via a view; for v1, RLS on the
-- column is not granular, so the client API must strip credentials_secret_id
-- for non-admins (enforced in the Edge Function layer).

create policy "import_jobs: org members read"
  on public.import_jobs for select
  using (public.is_org_member(organization_id));
create policy "import_jobs: service role writes"
  on public.import_jobs for insert
  with check (true);  -- only service role inserts; RLS still requires auth for reads

create policy "usage: org members read"
  on public.organization_usage for select
  using (public.is_org_member(organization_id));

create policy "alert_rules: org members read"
  on public.alert_rules for select
  using (public.is_org_member(organization_id));
create policy "alert_rules: editors+ write"
  on public.alert_rules for all
  using (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'))
  with check (public.current_org_role(organization_id) in ('owner','admin','editor','data_manager'));

create policy "notifications: owner read"
  on public.notifications for select
  using (auth.uid() = user_id or public.is_org_member(organization_id));
create policy "notifications: self mark read"
  on public.notifications for update
  using (auth.uid() = user_id);
create policy "notifications: service role insert"
  on public.notifications for insert
  with check (true);

comment on table public.data_source_connections is 'Connector configurations. credentials_secret_id references Supabase Vault; plaintext never stored.';
comment on table public.import_jobs            is 'One row per sync run; result_table_id points to the data_tables row produced.';
comment on table public.organization_usage     is 'Monthly rows-synced counter per org — source of truth for plan-limit enforcement.';
comment on table public.alert_rules            is 'Threshold alert definitions on indicators.';
comment on table public.notifications          is 'In-app + dispatched notifications; activity feed is derived from audit_logs (Phase E).';
