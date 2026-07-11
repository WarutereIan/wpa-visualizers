-- Phase C follow-up: rewrite seed_meal_template_for_org to use outputs.location.
--
-- 0020 rewrote the seed function to insert into outputs with `district`, and 0021
-- then renamed outputs.district → outputs.location. The seed function was never
-- updated, so it throws `column "district" of relation "outputs" does not exist`
-- whenever create_default_organization calls it during signup. This rewrites the
-- function against the current schema (outputs.location, indicator_definitions).

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

  insert into public.outputs (project_id, title, description, status, location, target_period)
  values (p_meals, 'Community kitchen upgrades — North',
    'Equipment and hygiene training for partner kitchens.', 'in_progress', 'North', '2026-Q1')
  returning id into o_kitchens;

  insert into public.outputs (project_id, title, description, status, location, target_period)
  values (p_meals, 'Beneficiary enrolment surge',
    'Onboarding aligned with Jan–Feb beneficiary rows.', 'completed', 'South', '2026-Q1')
  returning id into o_enrol;

  insert into public.outputs (project_id, title, description, status, location, target_period)
  values (p_cash, 'Digital payment channel',
    'Rollout mapped to Cash program rows (East / West).', 'in_progress', 'East', '2026-Q1')
  returning id into o_cash;

  insert into public.outputs (project_id, title, description, status, location, target_period)
  values (p_voucher, 'Retailer network — South',
    'Voucher redemption points (South, Mar).', 'planned', 'South', '2026-Q2')
  returning id into o_voucher;

  insert into public.indicator_definitions
    (organization_id, project_id, name, type, location, unit, baseline, target, current, period)
  values (p_org_id, p_meals, 'Coverage', 'percentage', 'North', '% households', 55, 75, 68, '2026-Q1')
  returning id into i_cov_n;

  insert into public.indicator_definitions
    (organization_id, project_id, name, type, location, unit, baseline, target, current, period)
  values (p_org_id, p_meals, 'Coverage', 'percentage', 'South', '% households', 50, 75, 61, '2026-Q1')
  returning id into i_cov_s;

  insert into public.indicator_definitions
    (organization_id, project_id, name, type, location, unit, baseline, target, current, period)
  values (p_org_id, p_meals, 'Timeliness', 'percentage', 'North', '% on-time', 70, 85, 82, '2026-Q1')
  returning id into i_time_n;

  insert into public.indicator_definitions
    (organization_id, project_id, name, type, location, unit, baseline, target, current, period)
  values (p_org_id, p_cash, 'Satisfaction', 'average', 'East', 'score / 100', 65, 80, 74, '2026-Q1')
  returning id into i_sat_e;

  insert into public.indicator_definitions
    (organization_id, project_id, name, type, location, unit, baseline, target, current, period)
  values (p_org_id, p_voucher, 'Timeliness', 'percentage', 'South', '% on-time', 72, 85, 79, '2026-Q1')
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

comment on function public.seed_meal_template_for_org is
  'Inserts demo MEAL projects/outputs/indicator_definitions/links for a new org (idempotent). Membership-guarded. Uses outputs.location (renamed from district in 0021).';
