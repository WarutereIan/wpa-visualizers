import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuthStore } from '#/stores/authStore'
import { useUserPreferences, useUpdateUserPreferences } from '#/lib/api/userPreferences'

/**
 * Sidebar collapse state that syncs to `user_preferences.sidebar_collapsed` when
 * signed in. Falls back to local state when not signed in (public/demo pages).
 */
export function usePersistedSidebarCollapsed() {
  const user = useAuthStore((s) => s.user)
  const organization = useAuthStore((s) => s.organization)
  const { data: prefs } = useUserPreferences(user?.id ?? null, organization?.id ?? null)
  const updatePrefs = useUpdateUserPreferences(user?.id ?? null)

  const [collapsed, setCollapsedState] = useState(false)
  const hydratedFor = useRef<string | null>(null)

  // Hydrate from server prefs once per user.
  useEffect(() => {
    if (!user || !prefs) return
    const key = user.id
    if (hydratedFor.current === key) return
    hydratedFor.current = key
    setCollapsedState(Boolean(prefs.sidebarCollapsed))
  }, [user, prefs])

  useEffect(() => {
    if (!user) hydratedFor.current = null
  }, [user])

  const setCollapsed = useCallback(
    (next: boolean) => {
      setCollapsedState(next)
      if (user) {
        void updatePrefs.mutate({ sidebarCollapsed: next })
      }
    },
    [user, updatePrefs],
  )

  const toggle = useCallback(() => setCollapsed(!collapsed), [collapsed, setCollapsed])

  return { collapsed, setCollapsed, toggle }
}
