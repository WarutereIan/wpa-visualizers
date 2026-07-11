-- Phase C/E consolidation: retire public.indicators; unify on indicator_definitions.
-- Adds location/unit/current, backfills from MEAL indicators, re-points FKs,
-- moves org-match trigger, rewrites seed function, drops legacy table.

-- ---------------------------------------------------------------------------
-- 1. Extend indicator_definitions with MEAL fields
-- ---------------------------------------------------------------------------
alter table public.indicator_definitions
  add column if not exists location text,
  add column if not exists unit text,
  add column if not exists current numeric;

-- Backfill from legacy MEAL indicators (ids preserved by 0006 migration).
update public.indicator_definitions d
set
  location = coalesce(d.location, i.location),
  unit = coalesce(d.unit, i.unit),
  current = coalesce(d.current, i.current),
  source_query_id = coalesce(d.source_query_id, i.source_query_id),
  period = coalesce(d.period, i.period),
  baseline = coalesce(d.baseline, i.baseline),
  target = coalesce(d.target, i.target),
  project_id = coalesce(d.project_id, i.project_id)
from public.indicators i
where d.id = i.id;

-- Copy any rows that exist only in indicators (safety net).
insert into public.indicator_definitions
  (id, organization_id, project_id, name, type, source_query_id, disaggregations,
   period, baseline, target, location, unit, current)
select
  i.id, i.organization_id, i.project_id, i.name, 'count', i.source_query_id, '[]'::jsonb,
  i.period, i.baseline, i.target, i.location, i.unit, i.current
from public.indicators i
where not exists (select 1 from public.indicator_definitions d where d.id = i.id);

-- ---------------------------------------------------------------------------
-- 2. Re-point output_indicator_links.indicator_id → indicator_definitions
-- ---------------------------------------------------------------------------
alter table public.output_indicator_links
  drop constraint if exists output_indicator_links_indicator_id_fkey;

alter table public.output_indicator_links
  add constraint output_indicator_links_indicator_id_fkey
  foreign key (indicator_id) references public.indicator_definitions(id) on delete cascade;

-- ---------------------------------------------------------------------------
-- 3. Re-point alert_rules.indicator_id → indicator_definitions (if present)
-- ---------------------------------------------------------------------------
do $$ begin
  alter table public.alert_rules
    drop constraint if exists alert_rules_indicator_id_fkey;
  alter table public.alert_rules
    add constraint alert_rules_indicator_id_fkey
    foreign key (indicator_id) references public.indicator_definitions(id) on delete cascade;
exception when undefined_table then null;
end $$;

-- ---------------------------------------------------------------------------
-- 4. Move project/org integrity trigger from indicators → indicator_definitions
-- ---------------------------------------------------------------------------
create or replace function public.assert_indicator_project_org_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  proj_org uuid;
begin
  if new.project_id is null then
    return new;
  end if;
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
drop trigger if exists indicator_definitions_project_org_match_trigger on public.indicator_definitions;
create trigger indicator_definitions_project_org_match_trigger
  before insert or update of project_id, organization_id on public.indicator_definitions
  for each row execute function public.assert_indicator_project_org_match();

-- ---------------------------------------------------------------------------
-- 5. Tighten link WITH CHECK to reference indicator_definitions
-- ---------------------------------------------------------------------------
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
        from public.indicator_definitions i
        join public.projects op on op.id = (
          select o2.project_id from public.outputs o2 where o2.id = output_id
        )
        join public.projects ip on ip.id = i.project_id
       where i.id = indicator_id
         and i.organization_id = op.organization_id
         and op.organization_id = ip.organization_id
    )
  );

-- ---------------------------------------------------------------------------
-- 6. Rewrite seed function to insert into indicator_definitions
-- ---------------------------------------------------------------------------
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

  insert into public.indicator_definitions
    (organization_id, project_id, name, type, location, unit, baseline, target, current, period)
  values (p_org_id, p_meals, 'Coverage', 'count', 'North', '% households', 55, 75, 68, '2026-Q1')
  returning id into i_cov_n;

  insert into public.indicator_definitions
    (organization_id, project_id, name, type, location, unit, baseline, target, current, period)
  values (p_org_id, p_meals, 'Coverage', 'count', 'South', '% households', 50, 75, 61, '2026-Q1')
  returning id into i_cov_s;

  insert into public.indicator_definitions
    (organization_id, project_id, name, type, location, unit, baseline, target, current, period)
  values (p_org_id, p_meals, 'Timeliness', 'count', 'North', '% on-time', 70, 85, 82, '2026-Q1')
  returning id into i_time_n;

  insert into public.indicator_definitions
    (organization_id, project_id, name, type, location, unit, baseline, target, current, period)
  values (p_org_id, p_cash, 'Satisfaction', 'count', 'East', 'score / 100', 65, 80, 74, '2026-Q1')
  returning id into i_sat_e;

  insert into public.indicator_definitions
    (organization_id, project_id, name, type, location, unit, baseline, target, current, period)
  values (p_org_id, p_voucher, 'Timeliness', 'count', 'South', '% on-time', 72, 85, 79, '2026-Q1')
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
  'Inserts demo MEAL projects/outputs/indicator_definitions/links for a new org (idempotent). Membership-guarded.';

-- ---------------------------------------------------------------------------
-- 7. Drop legacy indicators table
-- ---------------------------------------------------------------------------
drop trigger if exists indicators_set_updated_at on public.indicators;
drop policy if exists "indicators: org members read" on public.indicators;
drop policy if exists "indicators: editors+ write" on public.indicators;
drop table if exists public.indicators cascade;

comment on table public.indicator_definitions is
  'Unified indicator catalog (MEAL + semantic layer). Replaces legacy public.indicators.';
