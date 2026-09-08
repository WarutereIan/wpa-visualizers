-- Nullable project_id on query_definitions (null = organization-level / shared).
-- Access remains org-wide; this is a filter/ownership tag only.

alter table public.query_definitions
  add column if not exists project_id uuid references public.projects(id) on delete set null;

create index if not exists query_definitions_project_idx
  on public.query_definitions (project_id);

create or replace function public.assert_query_project_org_match()
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
    raise exception 'Query project_id does not reference an existing project';
  end if;
  if proj_org <> new.organization_id then
    raise exception 'Query organization_id must match its project organization_id';
  end if;
  return new;
end;
$$;

drop trigger if exists query_definitions_project_org_match_trigger on public.query_definitions;
create trigger query_definitions_project_org_match_trigger
  before insert or update of project_id, organization_id on public.query_definitions
  for each row execute function public.assert_query_project_org_match();
