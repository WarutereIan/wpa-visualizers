import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

export async function assertOrgMember(
  admin: SupabaseClient,
  orgId: string,
  userId: string,
): Promise<void> {
  const { data, error } = await admin
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) throw new Error('Forbidden')
}

const ROLE_RANK: Record<string, number> = {
  guest: 0,
  viewer: 1,
  partner: 1,
  editor: 2,
  data_manager: 2,
  admin: 3,
  owner: 4,
}

/** Throws `Forbidden` unless the user's org role is at least one of `allowedRoles`. */
export async function assertOrgRole(
  admin: SupabaseClient,
  orgId: string,
  userId: string,
  allowedRoles: string[],
): Promise<void> {
  const { data, error } = await admin
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) throw new Error('Forbidden')
  const userRank = ROLE_RANK[data.role] ?? 0
  const minRequired = Math.max(...allowedRoles.map((r) => ROLE_RANK[r] ?? 0))
  if (userRank < minRequired) throw new Error('Forbidden')
}
