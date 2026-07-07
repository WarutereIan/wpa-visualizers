import { useEffect } from 'react'
import { useAuthStore } from '#/stores/authStore'

/** Boots Supabase session on app load. Must wrap the router tree. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    void initialize()
  }, [initialize])

  return <>{children}</>
}
