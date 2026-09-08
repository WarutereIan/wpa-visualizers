import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { VisualizationDefinition } from '#/types/visualization'
import { getSupabase } from '#/lib/supabaseClient'
import { throwIfSupabaseError } from '#/lib/supabaseErrors'
import {
  mapDbVisualization,
  mapVisualizationToDb,
  type DbVisualization,
} from '#/lib/api/mappers'
import { workspaceKeys } from '#/lib/api/workspace'

async function fetchVisualizationsForOrg(
  orgId: string,
  queryId?: string,
): Promise<VisualizationDefinition[]> {
  const supabase = getSupabase()
  if (!supabase) return []

  let req = supabase
    .from('visualizations')
    .select('*')
    .eq('organization_id', orgId)
    .order('updated_at', { ascending: false })

  if (queryId) req = req.eq('query_id', queryId)

  const { data, error } = await req
  throwIfSupabaseError(error, 'api.fetchVisualizations', { orgId, queryId })
  return ((data ?? []) as DbVisualization[]).map(mapDbVisualization)
}

export function useVisualizations(orgId: string | null, queryId?: string) {
  return useQuery({
    queryKey: orgId
      ? workspaceKeys.visualizations(orgId, queryId)
      : ['workspace', 'visualizations', 'none'],
    queryFn: () => fetchVisualizationsForOrg(orgId!, queryId),
    enabled: Boolean(orgId),
  })
}

export function useCreateVisualization(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (
      input: Omit<VisualizationDefinition, 'id' | 'createdAt' | 'updatedAt'>,
    ) => {
      if (!orgId) throw new Error('No organization')
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')

      const id = crypto.randomUUID()
      const payload = mapVisualizationToDb({ ...input, id }, orgId)
      const { data, error } = await supabase
        .from('visualizations')
        .insert(payload)
        .select('*')
        .single()

      throwIfSupabaseError(error, 'api.createVisualization', { orgId })
      return mapDbVisualization(data as DbVisualization)
    },
    onSuccess: (data) => {
      if (!orgId) return
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.visualizations(orgId) })
      void queryClient.invalidateQueries({
        queryKey: workspaceKeys.visualizations(orgId, data.queryId),
      })
    },
  })
}

export function useUpdateVisualization(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string
      patch: Partial<Pick<VisualizationDefinition, 'name' | 'description' | 'type' | 'options'>>
    }) => {
      if (!orgId) throw new Error('No organization')
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')

      const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (patch.name !== undefined) update.name = patch.name
      if (patch.description !== undefined) update.description = patch.description ?? null
      if (patch.type !== undefined) update.type = patch.type
      if (patch.options !== undefined) update.options = patch.options

      const { data, error } = await supabase
        .from('visualizations')
        .update(update)
        .eq('id', id)
        .eq('organization_id', orgId)
        .select('*')
        .single()

      throwIfSupabaseError(error, 'api.updateVisualization', { orgId, id })
      return mapDbVisualization(data as DbVisualization)
    },
    onSuccess: (data) => {
      if (!orgId) return
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.visualizations(orgId) })
      void queryClient.invalidateQueries({
        queryKey: workspaceKeys.visualizations(orgId, data.queryId),
      })
    },
  })
}

export function useDeleteVisualization(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (!orgId) throw new Error('No organization')
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')

      const { error } = await supabase
        .from('visualizations')
        .delete()
        .eq('id', id)
        .eq('organization_id', orgId)

      throwIfSupabaseError(error, 'api.deleteVisualization', { orgId, id })
    },
    onSuccess: () => {
      if (orgId) void queryClient.invalidateQueries({ queryKey: workspaceKeys.visualizations(orgId) })
    },
  })
}
