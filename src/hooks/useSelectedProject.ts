import { useEffect, useRef } from 'react'
import { useAuthStore } from '#/stores/authStore'
import { useOutputsIndicatorsStore } from '#/stores/outputsIndicatorsStore'
import { useOrgId, useWorkspaceReady } from '#/lib/api/workspace'
import { useUpdateUserPreferences, useUserPreferences } from '#/lib/api/userPreferences'
import { isSupabaseConfigured } from '#/lib/env'
import type { WpaProject } from '#/types/outputsIndicators'

/**
 * Selected project id — persisted to `user_preferences` when signed in,
 * otherwise via `outputsIndicatorsStore` localStorage.
 */
export function useSelectedProject(projects?: WpaProject[]) {
  const workspaceReady = useWorkspaceReady()
  const orgId = useOrgId()
  const userId = useAuthStore((s) => s.user?.id ?? null)
  const selectedProjectId = useOutputsIndicatorsStore((s) => s.selectedProjectId)
  const setStoreId = useOutputsIndicatorsStore((s) => s.setSelectedProjectId)

  const prefsQuery = useUserPreferences(workspaceReady ? userId : null, orgId)
  const updatePrefs = useUpdateUserPreferences(workspaceReady ? userId : null)

  // Hydrate the local store from server prefs exactly once per (userId, orgId).
  // Re-running this on every prefs query change would fight the auto-select
  // effect below (server null vs. projects[0]) and cause an infinite update loop.
  const hydratedRef = useRef(false)
  useEffect(() => {
    if (!workspaceReady || !prefsQuery.data || hydratedRef.current) return
    hydratedRef.current = true
    const serverId = prefsQuery.data.selectedProjectId
    if (serverId !== selectedProjectId) {
      setStoreId(serverId)
    }
  }, [workspaceReady, prefsQuery.data, selectedProjectId, setStoreId])

  // Reset the hydration gate when the signed-in user or org changes so a
  // fresh login re-hydrates from that user's stored prefs.
  useEffect(() => {
    hydratedRef.current = false
  }, [userId, orgId])

  function setSelectedProjectId(id: string | null) {
    setStoreId(id)
    if (workspaceReady && userId) {
      void updatePrefs.mutateAsync({ selectedProjectId: id, uiState: { selectedProjectId: id } })
    }
  }

  useEffect(() => {
    if (!projects?.length) return
    const valid = selectedProjectId && projects.some((p) => p.id === selectedProjectId)
    if (!valid) {
      const next = projects[0]?.id ?? null
      if (next !== selectedProjectId) setSelectedProjectId(next)
    }
    // setSelectedProjectId is stable in behavior (closures over current refs);
    // excluding it avoids retriggering the auto-select on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, selectedProjectId])

  const persistEnabled = !isSupabaseConfigured()
  return {
    selectedProjectId,
    setSelectedProjectId,
    isLoading: workspaceReady && prefsQuery.isLoading,
    persistEnabled,
  }
}
