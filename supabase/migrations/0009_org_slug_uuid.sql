-- Use UUID-based organization slugs and serialize per-user provisioning.
-- Fixes 409 conflicts when signup + onAuthStateChange race on create_default_organization.

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

  -- Serialize provisioning per user (signup handler + onAuthStateChange can race).
  perform pg_advisory_xact_lock(hashtextextended('create_default_org:' || uid::text, 0));

  select p.default_organization_id into new_org_id
  from public.profiles p
  where p.id = uid and p.default_organization_id is not null;

  if new_org_id is not null and public.is_org_member(new_org_id) then
    return new_org_id;
  end if;

  new_org_id := gen_random_uuid();
  -- Slug is a stable unique identifier; display name stays human-readable.
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

comment on function public.create_default_organization is
  'Creates the first organization for a new user (owner role). Slug defaults to org UUID. Idempotent per user.';
