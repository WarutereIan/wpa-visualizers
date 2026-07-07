-- DIMES-BI — Phase A auth helpers
-- Signup org provisioning RPC + data_manager role (referenced in later RLS policies).

-- Extend organization_members.role to include data_manager (product-spec Data Manager role).
alter table public.organization_members
  drop constraint if exists organization_members_role_check;
alter table public.organization_members
  add constraint organization_members_role_check
  check (role in ('owner','admin','data_manager','editor','viewer','partner','guest'));

-- Idempotent org provisioning after signup. Callable by the authenticated user.
create or replace function public.create_default_organization(
  org_name text default 'My workspace',
  org_slug text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  new_org_id uuid;
  final_slug text;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('create_default_org:' || uid::text, 0));

  select p.default_organization_id into new_org_id
  from public.profiles p
  where p.id = uid and p.default_organization_id is not null;

  if new_org_id is not null and public.is_org_member(new_org_id) then
    return new_org_id;
  end if;

  new_org_id := gen_random_uuid();
  final_slug := coalesce(nullif(trim(org_slug), ''), new_org_id::text);

  insert into public.organizations (id, name, slug)
  values (
    new_org_id,
    coalesce(nullif(trim(org_name), ''), 'My workspace'),
    final_slug
  );

  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, uid, 'owner')
  on conflict (organization_id, user_id) do nothing;

  update public.profiles
  set default_organization_id = new_org_id,
      updated_at = now()
  where id = uid;

  return new_org_id;
exception
  when unique_violation then
    select p.default_organization_id into new_org_id
    from public.profiles p
    where p.id = uid;

    if new_org_id is not null then
      return new_org_id;
    end if;

    raise;
end;
$$;

grant execute on function public.create_default_organization(text, text) to authenticated;

comment on function public.create_default_organization is
  'Creates the first organization for a new user (owner role). Slug defaults to org UUID. Idempotent per user.';
