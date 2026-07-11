import { useEffect } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { isSupabaseConfigured } from '#/lib/env'
import { isPublicPath } from '#/types/auth'
import { useAuthStore } from '#/stores/authStore'

/**
 * Redirects unauthenticated users away from protected routes when Supabase is configured.
 * Renders a loading state while the session is being restored. If a session exists but the
 * user's workspace/org can't be resolved, surfaces an error with a retry instead of silently
 * letting the data layer fall back to demo data.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const initialized = useAuthStore((s) => s.initialized)
  const loading = useAuthStore((s) => s.loading)
  const session = useAuthStore((s) => s.session)
  const organization = useAuthStore((s) => s.organization)
  const refreshMembership = useAuthStore((s) => s.refreshMembership)
  const signOut = useAuthStore((s) => s.signOut)

  const authRequired = isSupabaseConfigured() && !isPublicPath(pathname)
  const isAuthPage = pathname === '/login' || pathname === '/signup'

  // Signed in but workspace resolution failed after init completed.
  const workspaceUnresolved =
    authRequired && initialized && Boolean(session) && !loading && !organization

  useEffect(() => {
    if (!initialized) return

    if (isSupabaseConfigured() && session && isAuthPage) {
      void navigate({ to: '/data-management', replace: true })
      return
    }

    if (authRequired && !session && !loading) {
      void navigate({
        to: '/login',
        search: { redirect: pathname },
        replace: true,
      })
    }
  }, [initialized, loading, session, authRequired, isAuthPage, pathname, navigate])

  if (authRequired && (!initialized || (loading && !organization))) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-sm text-[var(--sea-ink-soft)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--lagoon)]" />
        Loading workspace…
      </div>
    )
  }

  if (authRequired && !session) {
    return null
  }

  if (workspaceUnresolved) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="max-w-md space-y-2">
          <h2 className="text-lg font-semibold text-[var(--sea-ink)]">Workspace not ready</h2>
          <p className="text-sm text-[var(--sea-ink-soft)]">
            We couldn&apos;t load your workspace. This can happen if your profile wasn&apos;t fully
            provisioned on signup. Try retrying — if that doesn&apos;t work, sign out and back in.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            className="rounded-md border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2 text-sm font-medium text-[var(--sea-ink)] hover:bg-[var(--bg-base)]"
            onClick={() => void refreshMembership()}
          >
            Retry
          </button>
          <button
            type="button"
            className="rounded-md border border-[var(--line)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
            onClick={() => void signOut().then(() => navigate({ to: '/login' }))}
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
