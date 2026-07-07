import { useEffect } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { isSupabaseConfigured } from '#/lib/env'
import { isPublicPath } from '#/types/auth'
import { useAuthStore } from '#/stores/authStore'

/**
 * Redirects unauthenticated users away from protected routes when Supabase is configured.
 * Renders a loading state while the session is being restored.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const initialized = useAuthStore((s) => s.initialized)
  const loading = useAuthStore((s) => s.loading)
  const session = useAuthStore((s) => s.session)

  const authRequired = isSupabaseConfigured() && !isPublicPath(pathname)
  const isAuthPage = pathname === '/login' || pathname === '/signup'

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

  if (authRequired && (!initialized || (loading && !session))) {
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

  return <>{children}</>
}
