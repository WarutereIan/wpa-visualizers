-- Fix infinite recursion on organization_members SELECT policy.
-- The prior policy subqueried organization_members inside its own RLS check → 500 errors.
-- is_org_member() is security definer and bypasses RLS safely.

drop policy if exists "members: members can select" on public.organization_members;

create policy "members: members can select"
  on public.organization_members for select
  using (public.is_org_member(organization_id));

-- Also allow users to read their own membership rows directly (covers edge cases).
drop policy if exists "members: self read" on public.organization_members;
create policy "members: self read"
  on public.organization_members for select
  using (user_id = auth.uid());

grant execute on function public.current_org_role(uuid) to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
