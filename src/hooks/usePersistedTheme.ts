import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuthStore } from '#/stores/authStore'
import { useUserPreferences, useUpdateUserPreferences, type ThemeMode } from '#/lib/api/userPreferences'

function readLocalMode(): ThemeMode {
  if (typeof window === 'undefined') return 'auto'
  const stored = window.localStorage.getItem('theme')
  return stored === 'light' || stored === 'dark' || stored === 'auto' ? stored : 'auto'
}

function applyThemeMode(mode: ThemeMode) {
  if (typeof window === 'undefined') return
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolved = mode === 'auto' ? (prefersDark ? 'dark' : 'light') : mode

  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(resolved)

  if (mode === 'auto') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', mode)
  }

  document.documentElement.style.colorScheme = resolved
}

/**
 * Theme mode that always reads/writes localStorage and additionally syncs to
 * `user_preferences.theme` when the user is signed in. On sign-in, the server
 * preference is hydrated once (overriding localStorage) so theme follows the
 * user across devices.
 */
export function usePersistedTheme() {
  const user = useAuthStore((s) => s.user)
  const organization = useAuthStore((s) => s.organization)
  const { data: prefs } = useUserPreferences(user?.id ?? null, organization?.id ?? null)
  const updatePrefs = useUpdateUserPreferences(user?.id ?? null)

  const [mode, setModeState] = useState<ThemeMode>('auto')
  const hydratedFor = useRef<string | null>(null)

  // Apply mode to <html> whenever it changes.
  useEffect(() => {
    applyThemeMode(mode)
  }, [mode])

  // Re-apply 'auto' when the system preference changes while in auto mode.
  useEffect(() => {
    if (mode !== 'auto') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyThemeMode('auto')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [mode])

  // Hydrate from localStorage on mount (works on public pages too).
  useEffect(() => {
    setModeState(readLocalMode())
  }, [])

  // Hydrate from server prefs once per user, overriding localStorage.
  useEffect(() => {
    if (!user || !prefs) return
    const key = user.id
    if (hydratedFor.current === key) return
    hydratedFor.current = key
    if (prefs.theme && prefs.theme !== mode) {
      setModeState(prefs.theme)
      window.localStorage.setItem('theme', prefs.theme)
    }
  }, [user, prefs, mode])

  // Reset hydration marker on sign-out so a different user re-hydrates.
  useEffect(() => {
    if (!user) hydratedFor.current = null
  }, [user])

  const setMode = useCallback(
    (next: ThemeMode) => {
      setModeState(next)
      window.localStorage.setItem('theme', next)
      if (user) {
        void updatePrefs.mutate({ theme: next })
      }
    },
    [user, updatePrefs],
  )

  const toggle = useCallback(() => {
    const next: ThemeMode = mode === 'light' ? 'dark' : mode === 'dark' ? 'auto' : 'light'
    setMode(next)
  }, [mode, setMode])

  return { mode, setMode, toggle }
}
