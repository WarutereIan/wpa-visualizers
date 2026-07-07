-- Phase C: seed demo MEAL template for new orgs + hook into org provisioning.

create or replace function public.seed_meal_template_for_org(p_org_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  p_meals uuid;
  p_cash uuid;
  p_voucher uuid;
  o_kitchens uuid;
  o_enrol uuid;
  o_cash uuid;
  o_voucher uuid;
  i_cov_n uuid;
  i_cov_s uuid;
  i_time_n uuid;
  i_sat_e uuid;
  i_time_s uuid;
begin
  if exists (select 1 from public.projects where organization_id = p_org_id) then
    return;
  end if;

  insert into public.projects (organization_id, code, name, program, description, status)
  values
    (p_org_id, 'MEALS-01', 'Meal distribution — multi-district', 'Meals',
     'School and community meal coverage aligned with demo Households (North / South).', 'in_progress')
  returning id into p_meals;

  insert into public.projects (organization_id, code, name, program, description, status)
  values
    (p_org_id, 'CASH-01', 'Cash transfer pilot', 'Cash',
     'Direct cash assistance; ties to East / West rows in sample data.', 'in_progress')
  returning id into p_cash;

  insert into public.projects (organization_id, code, name, program, description, status)
  values
    (p_org_id, 'VOUCH-01', 'Voucher programme', 'Voucher',
     'Southern district voucher rollout (see South + Voucher in demo tables).', 'in_progress')
  returning id into p_voucher;

  insert into public.outputs (project_id, title, description, status, district, target_period)
  values (p_meals, 'Community kitchen upgrades — North',
    'Equipment and hygiene training for partner kitchens.', 'in_progress', 'North', '2026-Q1')
  returning id into o_kitchens;

  insert into public.outputs (project_id, title, description, status, district, target_period)
  values (p_meals, 'Beneficiary enrolment surge',
    'Onboarding aligned with Jan–Feb beneficiary rows.', 'completed', 'South', '2026-Q1')
  returning id into o_enrol;

  insert into public.outputs (project_id, title, description, status, district, target_period)
  values (p_cash, 'Digital payment channel',
    'Rollout mapped to Cash program rows (East / West).', 'in_progress', 'East', '2026-Q1')
  returning id into o_cash;

  insert into public.outputs (project_id, title, description, status, district, target_period)
  values (p_voucher, 'Retailer network — South',
    'Voucher redemption points (South, Mar).', 'planned', 'South', '2026-Q2')
  returning id into o_voucher;

  insert into public.indicators (organization_id, project_id, name, location, unit, baseline, target, current, period)
  values (p_org_id, p_meals, 'Coverage', 'North', '% households', 55, 75, 68, '2026-Q1')
  returning id into i_cov_n;

  insert into public.indicators (organization_id, project_id, name, location, unit, baseline, target, current, period)
  values (p_org_id, p_meals, 'Coverage', 'South', '% households', 50, 75, 61, '2026-Q1')
  returning id into i_cov_s;

  insert into public.indicators (organization_id, project_id, name, location, unit, baseline, target, current, period)
  values (p_org_id, p_meals, 'Timeliness', 'North', '% on-time', 70, 85, 82, '2026-Q1')
  returning id into i_time_n;

  insert into public.indicators (organization_id, project_id, name, location, unit, baseline, target, current, period)
  values (p_org_id, p_cash, 'Satisfaction', 'East', 'score / 100', 65, 80, 74, '2026-Q1')
  returning id into i_sat_e;

  insert into public.indicators (organization_id, project_id, name, location, unit, baseline, target, current, period)
  values (p_org_id, p_voucher, 'Timeliness', 'South', '% on-time', 72, 85, 79, '2026-Q1')
  returning id into i_time_s;

  insert into public.output_indicator_links (output_id, indicator_id, weight, note) values
    (o_kitchens, i_cov_n, 0.45, 'Kitchen reach'),
    (o_kitchens, i_time_n, 0.35, null),
    (o_enrol, i_cov_s, 0.6, 'Enrolment drives coverage'),
    (o_enrol, i_time_n, 0.15, null),
    (o_cash, i_sat_e, 0.55, null),
    (o_voucher, i_time_s, 0.5, null),
    (o_voucher, i_cov_s, 0.25, null);
end;
$$;

grant execute on function public.seed_meal_template_for_org(uuid) to authenticated;

-- Extend org provisioning to seed MEAL demo data once per org.
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
    perform public.seed_meal_template_for_org(new_org_id);
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

comment on function public.seed_meal_template_for_org is
  'Inserts demo MEAL projects/outputs/indicators/links for a new org (idempotent).';
