-- Phase C audit fixes:
-- 1. Guard seed_meal_template_for_org so only org members can seed their own org.
-- 2. Add check constraint: indicators.project_id must belong to indicators.organization_id.
-- 3. Tighten output_indicator_links WITH CHECK to verify the indicator's org
--    matches the output's project org (prevents cross-org links via known UUIDs).

-- 1. Re-create seed function with a membership guard.
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
  -- Only members of the target org may seed it. Service role (auth.uid() null)
  -- is allowed for internal provisioning paths.
  if auth.uid() is not null and not public.is_org_member(p_org_id) then
    raise exception 'Forbidden';
  end if;

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

comment on function public.seed_meal_template_for_org is
  'Inserts demo MEAL projects/outputs/indicators/links for a new org (idempotent). Membership-guarded.';

-- 2. indicators.project_id must belong to the same org as indicators.organization_id.
--    CHECK constraints cannot reference other tables, so enforce via a trigger.
create or replace function public.assert_indicator_project_org_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  proj_org uuid;
begin
  select organization_id into proj_org from public.projects where id = new.project_id;
  if proj_org is null then
    raise exception 'Indicator project_id does not reference an existing project';
  end if;
  if proj_org <> new.organization_id then
    raise exception 'Indicator organization_id must match its project organization_id';
  end if;
  return new;
end;
$$;

drop trigger if exists indicators_project_org_match_trigger on public.indicators;
create trigger indicators_project_org_match_trigger
  before insert or update of project_id, organization_id on public.indicators
  for each row execute function public.assert_indicator_project_org_match();

-- 3. Tighten link WITH CHECK: indicator's org must match the output's project org.
drop policy if exists "links: editors+ write" on public.output_indicator_links;
create policy "links: editors+ write"
  on public.output_indicator_links for all
  using (public.current_org_role(
    (select p.organization_id
       from public.outputs o
       join public.projects p on p.id = o.project_id
      where o.id = output_id)
  ) in ('owner','admin','editor','data_manager'))
  with check (
    public.current_org_role(
      (select p.organization_id
         from public.outputs o
         join public.projects p on p.id = o.project_id
        where o.id = output_id)
    ) in ('owner','admin','editor','data_manager')
    and exists (
      select 1
        from public.indicators i
        join public.projects op on op.id = (
          select o2.project_id from public.outputs o2 where o2.id = output_id
        )
        join public.projects ip on ip.id = i.project_id
       where i.id = indicator_id
         and i.organization_id = op.organization_id
         and op.organization_id = ip.organization_id
    )
  );
