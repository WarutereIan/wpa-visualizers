import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { MappingDefinition } from '#/types/mapping'
import { getSupabase } from '#/lib/supabaseClient'
import { throwIfSupabaseError } from '#/lib/supabaseErrors'
import {
  mapDbMapping,
  mapMappingToDb,
  type DbMapping,
} from '#/lib/api/mappers'
import { workspaceKeys } from '#/lib/api/workspace'

async function fetchMappingsForOrg(orgId: string): Promise<MappingDefinition[]> {
  const supabase = getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('mappings')
    .select('*')
    .eq('organization_id', orgId)
    .order('updated_at', { ascending: false })

  throwIfSupabaseError(error, 'api.fetchMappings', { orgId })
  return ((data ?? []) as DbMapping[]).map(mapDbMapping)
}

export function useMappings(orgId: string | null) {
  return useQuery({
    queryKey: orgId ? workspaceKeys.mappings(orgId) : ['workspace', 'mappings', 'none'],
    queryFn: () => fetchMappingsForOrg(orgId!),
    enabled: Boolean(orgId),
  })
}

export function useMapping(orgId: string | null, mappingId: string | null) {
  return useQuery({
    queryKey:
      orgId && mappingId
        ? workspaceKeys.mapping(orgId, mappingId)
        : ['workspace', 'mapping', 'none'],
    queryFn: async () => {
      const all = await fetchMappingsForOrg(orgId!)
      const found = all.find((m) => m.id === mappingId)
      if (!found) throw new Error('Mapping not found')
      return found
    },
    enabled: Boolean(orgId && mappingId),
  })
}

export function useUpsertMapping(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (mapping: MappingDefinition) => {
      if (!orgId) throw new Error('No organization')
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')

      const payload = {
        ...mapMappingToDb(mapping, orgId),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('mappings')
        .upsert(payload)
        .select('*')
        .single()

      throwIfSupabaseError(error, 'api.upsertMapping', { orgId, id: mapping.id })
      return mapDbMapping(data as DbMapping)
    },
    onSuccess: (data) => {
      if (!orgId) return
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.mappings(orgId) })
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.mapping(orgId, data.id) })
    },
  })
}

export function useDeleteMapping(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (mappingId: string) => {
      if (!orgId) throw new Error('No organization')
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')

      const { error } = await supabase
        .from('mappings')
        .delete()
        .eq('id', mappingId)
        .eq('organization_id', orgId)

      throwIfSupabaseError(error, 'api.deleteMapping', { orgId, mappingId })
    },
    onSuccess: () => {
      if (orgId) void queryClient.invalidateQueries({ queryKey: workspaceKeys.mappings(orgId) })
    },
  })
}
