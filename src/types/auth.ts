export type OrganizationRole =
  | 'owner'
  | 'admin'
  | 'data_manager'
  | 'editor'
  | 'viewer'
  | 'partner'
  | 'guest'

export interface UserProfile {
  id: string
  displayName: string | null
  avatarUrl: string | null
  defaultOrganizationId: string | null
}

export interface OrganizationSummary {
  id: string
  name: string
  slug: string
  plan: string
}

/** Routes accessible without a session when Supabase auth is enabled. */
export const PUBLIC_PATHS = new Set(['/', '/pricing', '/login', '/signup', '/dev/viz-smoke'])

export function isPublicPath(pathname: string): boolean {
  if (pathname.startsWith('/shared/')) return true
  const normalized = pathname.replace(/\/$/, '') || '/'
  return PUBLIC_PATHS.has(normalized) || PUBLIC_PATHS.has(pathname)
}
