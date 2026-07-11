-- Phase A follow-up: harden profile provisioning and align invites role enum.
--
-- Problems addressed:
--  1. create_default_organization only UPDATEd profiles, assuming handle_new_user()
--     had already inserted the row. If the trigger was missing/failed, the UPDATE
--     matched 0 rows and the frontend could never resolve the user's org, leaving
--     them authenticated but stuck on demo data. Now we INSERT-or-nothing the
--     profile row first, so provisioning is self-healing.
--  2. display_name was never set on signup. The RPC now accepts an optional
--     p_display_name and writes it through to profiles.
--  3. organization_invites.role check constraint was missing 'data_manager',
--     inconsistent with organization_members (0007) and the rest of the app.

-- ---------------------------------------------------------------------------
-- 1. Rewrite create_default_organization with profile INSERT fallback + display_name
-- ---------------------------------------------------------------------------
-- Drop the old (text, text) signature first so we replace rather than overload.
drop function if exists public.create_default_organization(text, text);

create or replace function public.create_default_organization(
  p_org_name text default 'My workspace',
  p_org_slug text default null,
  p_display_name text default null
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

  -- Self-heal: ensure a profile row exists even if handle_new_user() didn't fire.
  insert into public.profiles (id, display_name)
  values (uid, nullif(trim(p_display_name), ''))
  on conflict (id) do nothing;

  select p.default_organization_id into new_org_id
  from public.profiles p
  where p.id = uid and p.default_organization_id is not null;

  if new_org_id is not null and public.is_org_member(new_org_id) then
    perform public.seed_meal_template_for_org(new_org_id);
    return new_org_id;
  end if;

  new_org_id := gen_random_uuid();
  final_slug := coalesce(nullif(trim(p_org_slug), ''), new_org_id::text);

  insert into public.organizations (id, name, slug)
  values (
    new_org_id,
    coalesce(nullif(trim(p_org_name), ''), 'My workspace'),
    final_slug
  );

  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, uid, 'owner')
  on conflict (organization_id, user_id) do nothing;

  update public.profiles
  set default_organization_id = new_org_id,
      display_name = coalesce(nullif(trim(p_display_name), ''), display_name),
      updated_at = now()
  where id = uid;

  perform public.seed_meal_template_for_org(new_org_id);

  return new_org_id;
exception
  when unique_violation then
    select p.default_organization_id into new_org_id
    from public.profiles p
    where p.id = uid;

    if new_org_id is not null then
      perform public.seed_meal_template_for_org(new_org_id);
      return new_org_id;
    end if;

    raise;
end;
$$;

comment on function public.create_default_organization is
  'Provisions a default organization + owner membership for the calling user, seeds the MEAL template, and links it on profiles.default_organization_id. Self-heals a missing profile row. Accepts an optional display_name. Idempotent; guarded by a per-user advisory lock.';

-- Re-grant execute (create or replace preserves grants, but be explicit).
grant execute on function public.create_default_organization(text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Fix organization_invites role check constraint to include data_manager
-- ---------------------------------------------------------------------------
alter table public.organization_invites
  drop constraint if exists organization_invites_role_check;

alter table public.organization_invites
  add constraint organization_invites_role_check
  check (role in ('owner','admin','data_manager','editor','viewer','partner','guest'));
