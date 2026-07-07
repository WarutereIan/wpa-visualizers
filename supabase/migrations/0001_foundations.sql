-- DIMES-BI — Phase A foundations
-- Extensions, organizations, profiles, organization_members, and shared helpers.
-- Referenced by 0002_data_storage_layer.sql via foreign keys.

create extension if not exists "pgcrypto";
create extension if not exists "pg_jsonschema";

-- ---------------------------------------------------------------------------
-- Shared updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- organizations (top-level tenant)
-- ---------------------------------------------------------------------------
create table if not exists public.organizations (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  plan            text not null default 'free'
                  check (plan in ('free','starter','professional','enterprise')),
  billing_status  text not null default 'active',
  subscription_ends_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- profiles (extends auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  display_name            text,
  avatar_url              text,
  default_organization_id uuid references public.organizations(id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- organization_members
-- ---------------------------------------------------------------------------
create table if not exists public.organization_members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null default 'viewer'
                  check (role in ('owner','admin','editor','viewer','partner','guest')),
  created_at      timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index on public.organization_members (user_id);

-- Helper: is the current user a member of a given organization?
create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = org_id and m.user_id = auth.uid()
  );
$$;

-- Helper: role of the current user in a given organization (or null).
create or replace function public.current_org_role(org_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select m.role from public.organization_members m
  where m.organization_id = org_id and m.user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- RLS: organizations + members
-- ---------------------------------------------------------------------------
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.profiles enable row level security;

create policy "orgs: members can select"
  on public.organizations for select
  using (public.is_org_member(id));

create policy "members: members can select"
  on public.organization_members for select
  using (public.is_org_member(organization_id));

create policy "members: self read"
  on public.organization_members for select
  using (user_id = auth.uid());

create policy "members: owners/admins manage"
  on public.organization_members for all
  using (public.current_org_role(organization_id) in ('owner','admin'))
  with check (public.current_org_role(organization_id) in ('owner','admin'));

create policy "profiles: self read/update"
  on public.profiles for select
  using (auth.uid() = id);
create policy "profiles: self update"
  on public.profiles for update
  using (auth.uid() = id);
