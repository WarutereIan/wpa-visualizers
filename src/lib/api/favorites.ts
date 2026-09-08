import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupabase } from '#/lib/supabaseClient'
import { throwIfSupabaseError } from '#/lib/supabaseErrors'
import { workspaceKeys } from '#/lib/api/workspace'
import type { FavoriteItem, FavoriteObjectType } from '#/stores/dashboardStore'

export type { FavoriteItem, FavoriteObjectType }

type DbFavorite = {
  user_id: string
  organization_id: string
  object_type: FavoriteObjectType
  object_id: string
  created_at: string
}

function mapDbFavorite(row: DbFavorite): FavoriteItem {
  return { objectType: row.object_type, objectId: row.object_id }
}

async function fetchFavoritesForOrg(orgId: string, userId: string): Promise<FavoriteItem[]> {
  const supabase = getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  throwIfSupabaseError(error, 'api.fetchFavorites', { orgId })
  return ((data ?? []) as DbFavorite[]).map(mapDbFavorite)
}

export function useFavoritesQuery(orgId: string | null, userId: string | null) {
  return useQuery({
    queryKey: orgId ? workspaceKeys.favorites(orgId) : ['workspace', 'favorites', 'none'],
    queryFn: () => fetchFavoritesForOrg(orgId!, userId!),
    enabled: Boolean(orgId) && Boolean(userId),
  })
}

export function useToggleFavoriteMutation(orgId: string | null, userId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      objectType,
      objectId,
      currentlyFavorite,
    }: {
      objectType: FavoriteObjectType
      objectId: string
      currentlyFavorite: boolean
    }) => {
      if (!orgId) throw new Error('No organization')
      if (!userId) throw new Error('Not signed in')
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')

      if (currentlyFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('organization_id', orgId)
          .eq('object_type', objectType)
          .eq('object_id', objectId)

        throwIfSupabaseError(error, 'api.removeFavorite', { orgId, objectType, objectId })
        return
      }

      const { error } = await supabase.from('favorites').insert({
        user_id: userId,
        organization_id: orgId,
        object_type: objectType,
        object_id: objectId,
      })

      throwIfSupabaseError(error, 'api.addFavorite', { orgId, objectType, objectId })
    },
    onSuccess: () => {
      if (orgId) void queryClient.invalidateQueries({ queryKey: workspaceKeys.favorites(orgId) })
    },
  })
}
