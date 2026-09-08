import { useCallback } from 'react'
import { useFavoritesQuery, useToggleFavoriteMutation } from '#/lib/api/favorites'
import { useOrgId, useWorkspaceReady } from '#/lib/api/workspace'
import { useAuthStore } from '#/stores/authStore'
import {
  useDashboardStore,
  type FavoriteItem,
  type FavoriteObjectType,
} from '#/stores/dashboardStore'

export function useFavorites() {
  const workspaceReady = useWorkspaceReady()
  const orgId = useOrgId()
  const userId = useAuthStore((s) => s.user?.id ?? null)

  const demoFavorites = useDashboardStore((s) => s.favorites)
  const demoIsFavorite = useDashboardStore((s) => s.isFavorite)
  const demoToggle = useDashboardStore((s) => s.toggleFavorite)

  const serverQuery = useFavoritesQuery(workspaceReady ? orgId : null, workspaceReady ? userId : null)
  const toggleMutation = useToggleFavoriteMutation(
    workspaceReady ? orgId : null,
    workspaceReady ? userId : null,
  )

  const favorites: FavoriteItem[] = workspaceReady ? (serverQuery.data ?? []) : demoFavorites

  const isFavorite = useCallback(
    (type: FavoriteObjectType, id: string) => {
      if (workspaceReady) {
        return favorites.some((f) => f.objectType === type && f.objectId === id)
      }
      return demoIsFavorite(type, id)
    },
    [workspaceReady, favorites, demoIsFavorite],
  )

  const toggleFavorite = useCallback(
    async (type: FavoriteObjectType, id: string) => {
      if (workspaceReady) {
        await toggleMutation.mutateAsync({
          objectType: type,
          objectId: id,
          currentlyFavorite: isFavorite(type, id),
        })
        return
      }
      demoToggle(type, id)
    },
    [workspaceReady, toggleMutation, isFavorite, demoToggle],
  )

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    isLoading: workspaceReady ? serverQuery.isLoading : false,
  }
}
