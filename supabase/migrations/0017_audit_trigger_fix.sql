-- Phase E fix: audit_t() org_id resolution for tables without organization_id
-- (outputs via project_id, data_table_columns via data_table_id).

create or replace function public.audit_t()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  org_id uuid;
  ent_id uuid;
  row_json jsonb;
begin
  if tg_op = 'DELETE' then
    row_json := to_jsonb(old);
  else
    row_json := to_jsonb(new);
  end if;

  if row_json ? 'organization_id' and row_json->>'organization_id' is not null then
    org_id := (row_json->>'organization_id')::uuid;
  elsif row_json ? 'project_id' and row_json->>'project_id' is not null then
    select p.organization_id into org_id
      from public.projects p
     where p.id = (row_json->>'project_id')::uuid;
  elsif row_json ? 'data_table_id' and row_json->>'data_table_id' is not null then
    select dt.organization_id into org_id
      from public.data_tables dt
     where dt.id = (row_json->>'data_table_id')::uuid;
  elsif row_json ? 'dashboard_id' and row_json->>'dashboard_id' is not null then
    select d.organization_id into org_id
      from public.dashboards d
     where d.id = (row_json->>'dashboard_id')::uuid;
  elsif row_json ? 'snapshot_id' and row_json->>'snapshot_id' is not null then
    select s.organization_id into org_id
      from public.dashboard_snapshots s
     where s.id = (row_json->>'snapshot_id')::uuid;
  end if;

  if row_json ? 'id' and row_json->>'id' is not null then
    ent_id := (row_json->>'id')::uuid;
  end if;

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
