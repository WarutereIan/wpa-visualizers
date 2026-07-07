-- Phase D audit fixes:
-- 1. promote_storage_backend: membership guard + restrict EXECUTE to service_role.
-- 2. bump_org_usage: membership guard + restrict EXECUTE to service_role.
--
-- Background: CREATE FUNCTION defaults EXECUTE to PUBLIC, and both functions
-- are SECURITY DEFINER. Without guards, any authenticated user could flip
-- another org's storage_backend (causing data loss when flipping parquet→jsonb
-- after rows were deleted) or tamper with organization_usage (bypassing plan
-- limits). Service role (auth.uid() IS NULL) is trusted for the edge-function
-- path; user callers must be members of the target org.

create or replace function public.promote_storage_backend(
  target_table uuid,
  target public.data_storage_backend
)
returns public.data_storage_backend
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count bigint;
  tbl_org uuid;
  uid uuid := auth.uid();
begin
  select organization_id into tbl_org from public.data_tables where id = target_table;
  if tbl_org is null then
    raise exception 'Table not found';
  end if;
  if uid is not null and not public.is_org_member(tbl_org) then
    raise exception 'Forbidden';
  end if;

  if target = 'jsonb' then
    select count(*) into new_count
    from public.data_table_rows
    where data_table_id = target_table;
  else
    new_count := (select row_count from public.data_tables where id = target_table);
  end if;

  update public.data_tables
     set storage_backend = target,
         row_count = coalesce(new_count, row_count),
         updated_at = now()
   where id = target_table;

  return target;
end;
$$;

revoke execute on function public.promote_storage_backend(uuid, public.data_storage_backend) from public;
grant execute on function public.promote_storage_backend(uuid, public.data_storage_backend) to service_role;

create or replace function public.bump_org_usage(org_id uuid, month_str text, delta bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is not null and not public.is_org_member(org_id) then
    raise exception 'Forbidden';
  end if;
  insert into public.organization_usage (organization_id, month, rows_synced)
  values (org_id, month_str, delta)
  on conflict (organization_id, month)
  do update set rows_synced = organization_usage.rows_synced + excluded.rows_synced;
end;
$$;

revoke execute on function public.bump_org_usage(uuid, text, bigint) from public;
grant execute on function public.bump_org_usage(uuid, text, bigint) to service_role;
