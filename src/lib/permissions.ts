import type { OrganizationRole } from '#/types/auth'

const DASHBOARD_EDIT_ROLES = new Set<OrganizationRole>([
  'owner',
  'admin',
  'data_manager',
  'editor',
])

/**
 * Who can create/edit/delete dashboards.
 * Demo (no signed-in workspace) is fully editable locally.
 */
export function canEditDashboards(
  role: OrganizationRole | null,
  workspaceReady: boolean,
): boolean {
  if (!workspaceReady) return true
  return role != null && DASHBOARD_EDIT_ROLES.has(role)
}
