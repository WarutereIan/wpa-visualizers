import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invokeEdgeFunction } from '#/lib/api/invoke'
import {
  mapDbIndicator,
  mapDbLink,
  mapDbOutput,
  mapDbProject,
  type DbIndicator,
  type DbOutput,
  type DbOutputIndicatorLink,
  type DbProject,
} from '#/lib/api/mappers'
import { workspaceKeys } from '#/lib/api/workspace'
import { getSupabase } from '#/lib/supabaseClient'
import { throwIfSupabaseError } from '#/lib/supabaseErrors'
import type {
  MealBundle,
  OutputIndicatorLink,
  ProjectStatus,
  Indicator,
  Output,
  Project,
} from '#/types/outputsIndicators'

async function ensureMealSeeded(orgId: string): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) return
  const { error } = await supabase.rpc('seed_meal_template_for_org', { p_org_id: orgId })
  if (error) throwIfSupabaseError(error, 'api.seedMealTemplate', { orgId })
}

export async function fetchMealBundle(orgId: string): Promise<MealBundle> {
  const supabase = getSupabase()
  if (!supabase) {
    return { projects: [], outputs: [], indicators: [], links: [] }
  }

  await ensureMealSeeded(orgId)

  const { data: projects, error: projError } = await supabase
    .from('projects')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true })

  throwIfSupabaseError(projError, 'api.fetchProjects', { orgId })
  const projectRows = (projects ?? []) as DbProject[]
  const projectIds = projectRows.map((p) => p.id)

  const [outputsRes, indicatorsRes] = await Promise.all([
    projectIds.length
      ? supabase.from('outputs').select('*').in('project_id', projectIds).order('created_at')
      : Promise.resolve({ data: [], error: null } as { data: never[]; error: null }),
    supabase
      .from('indicator_definitions')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at'),
  ])

  throwIfSupabaseError(outputsRes.error, 'api.fetchOutputs', { orgId })
  throwIfSupabaseError(indicatorsRes.error, 'api.fetchIndicators', { orgId })

  const outputRows = (outputsRes.data ?? []) as DbOutput[]
  const outputIds = outputRows.map((o) => o.id)

  const linksRes =
    outputIds.length > 0
      ? await supabase.from('output_indicator_links').select('*').in('output_id', outputIds)
      : { data: [], error: null }

  throwIfSupabaseError(linksRes.error, 'api.fetchLinks', { orgId })

  return {
    projects: projectRows.map(mapDbProject),
    outputs: outputRows.map(mapDbOutput),
    indicators: ((indicatorsRes.data ?? []) as DbIndicator[]).map(mapDbIndicator),
    links: ((linksRes.data ?? []) as DbOutputIndicatorLink[]).map(mapDbLink),
  }
}

export function useMealBundle(orgId: string | null) {
  return useQuery({
    queryKey: orgId ? workspaceKeys.meal(orgId) : ['workspace', 'meal', 'none'],
    queryFn: () => fetchMealBundle(orgId!),
    enabled: Boolean(orgId),
  })
}

function invalidateMeal(queryClient: ReturnType<typeof useQueryClient>, orgId: string) {
  void queryClient.invalidateQueries({ queryKey: workspaceKeys.meal(orgId) })
}

export function useCreateProject(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      name: string
      code?: string
      program?: string
      description?: string
      status?: ProjectStatus
      startDate?: string | null
      endDate?: string | null
    }) => {
      if (!orgId) throw new Error('No organization')
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')

      const { data, error } = await supabase
        .from('projects')
        .insert({
          organization_id: orgId,
          name: input.name.trim(),
          code: input.code?.trim() || null,
          program: input.program?.trim() || null,
          description: input.description?.trim() || '',
          status: input.status ?? 'in_progress',
          start_date: input.startDate ?? null,
          end_date: input.endDate ?? null,
        })
        .select('*')
        .single()

      throwIfSupabaseError(error, 'api.createProject', { orgId })
      return mapDbProject(data as DbProject)
    },
    onSuccess: () => {
      if (orgId) invalidateMeal(queryClient, orgId)
    },
  })
}

export function useUpdateProject(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string
      patch: Partial<Pick<Project, 'name' | 'code' | 'program' | 'description' | 'status' | 'startDate' | 'endDate'>>
    }) => {
      if (!orgId) throw new Error('No organization')
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')

      const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (patch.name !== undefined) update.name = patch.name
      if (patch.code !== undefined) update.code = patch.code || null
      if (patch.program !== undefined) update.program = patch.program || null
      if (patch.description !== undefined) update.description = patch.description
      if (patch.status !== undefined) update.status = patch.status
      if (patch.startDate !== undefined) update.start_date = patch.startDate || null
      if (patch.endDate !== undefined) update.end_date = patch.endDate || null

      const { data, error } = await supabase
        .from('projects')
        .update(update)
        .eq('id', id)
        .eq('organization_id', orgId)
        .select('*')
        .single()

      throwIfSupabaseError(error, 'api.updateProject', { orgId, id })
      return mapDbProject(data as DbProject)
    },
    onSuccess: () => {
      if (orgId) invalidateMeal(queryClient, orgId)
    },
  })
}

export function useDeleteProject(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (!orgId) throw new Error('No organization')
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')

      const { error } = await supabase.from('projects').delete().eq('id', id).eq('organization_id', orgId)
      throwIfSupabaseError(error, 'api.deleteProject', { orgId, id })
    },
    onSuccess: () => {
      if (orgId) invalidateMeal(queryClient, orgId)
    },
  })
}

export function useCreateOutput(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (
      input: Omit<Output, 'id' | 'createdAt' | 'updatedAt'> & { projectId: string },
    ) => {
      if (!orgId) throw new Error('No organization')
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')

      const { data, error } = await supabase
        .from('outputs')
        .insert({
          project_id: input.projectId,
          title: input.title.trim(),
          description: input.description?.trim() || '',
          status: input.status,
          location: input.location || null,
          target_period: input.targetPeriod || null,
        })
        .select('*')
        .single()

      throwIfSupabaseError(error, 'api.createOutput', { orgId })
      return mapDbOutput(data as DbOutput)
    },
    onSuccess: () => {
      if (orgId) invalidateMeal(queryClient, orgId)
    },
  })
}

export function useUpdateOutput(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Output> }) => {
      if (!orgId) throw new Error('No organization')
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')

      const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (patch.title !== undefined) update.title = patch.title
      if (patch.description !== undefined) update.description = patch.description
      if (patch.status !== undefined) update.status = patch.status
      if (patch.location !== undefined) update.location = patch.location || null
      if (patch.targetPeriod !== undefined) update.target_period = patch.targetPeriod || null
      if (patch.projectId !== undefined) update.project_id = patch.projectId

      const { data, error } = await supabase
        .from('outputs')
        .update(update)
        .eq('id', id)
        .select('*')
        .single()

      throwIfSupabaseError(error, 'api.updateOutput', { orgId, id })
      return mapDbOutput(data as DbOutput)
    },
    onSuccess: () => {
      if (orgId) invalidateMeal(queryClient, orgId)
    },
  })
}

export function useDeleteOutput(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (!orgId) throw new Error('No organization')
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')

      const { error } = await supabase.from('outputs').delete().eq('id', id)
      throwIfSupabaseError(error, 'api.deleteOutput', { orgId, id })
    },
    onSuccess: () => {
      if (orgId) invalidateMeal(queryClient, orgId)
    },
  })
}

export function useCreateIndicator(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<Indicator, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) => {
      if (!orgId) throw new Error('No organization')
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')

      const { data, error } = await supabase
        .from('indicator_definitions')
        .insert({
          organization_id: orgId,
          project_id: input.projectId ?? null,
          name: input.name.trim(),
          type: input.type ?? 'count',
          location: input.location || null,
          unit: input.unit || null,
          baseline: input.baseline,
          target: input.target,
          current: input.current,
          period: input.period || null,
          source_query_id: input.sourceQueryId ?? null,
          formula: input.formula ?? {},
          disaggregations: input.disaggregations ?? [],
        })
        .select('*')
        .single()

      throwIfSupabaseError(error, 'api.createIndicator', { orgId })
      return mapDbIndicator(data as DbIndicator)
    },
    onSuccess: () => {
      if (orgId) invalidateMeal(queryClient, orgId)
    },
  })
}

export function useUpdateIndicator(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Indicator> }) => {
      if (!orgId) throw new Error('No organization')
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')

      const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (patch.name !== undefined) update.name = patch.name
      if (patch.type !== undefined) update.type = patch.type
      if (patch.location !== undefined) update.location = patch.location || null
      if (patch.unit !== undefined) update.unit = patch.unit || null
      if (patch.baseline !== undefined) update.baseline = patch.baseline
      if (patch.target !== undefined) update.target = patch.target
      if (patch.current !== undefined) update.current = patch.current
      if (patch.period !== undefined) update.period = patch.period || null
      if (patch.projectId !== undefined) update.project_id = patch.projectId ?? null
      if (patch.sourceQueryId !== undefined) update.source_query_id = patch.sourceQueryId
      if (patch.formula !== undefined) update.formula = patch.formula
      if (patch.disaggregations !== undefined) update.disaggregations = patch.disaggregations

      const { data, error } = await supabase
        .from('indicator_definitions')
        .update(update)
        .eq('id', id)
        .eq('organization_id', orgId)
        .select('*')
        .single()

      throwIfSupabaseError(error, 'api.updateIndicator', { orgId, id })
      return mapDbIndicator(data as DbIndicator)
    },
    onSuccess: () => {
      if (orgId) invalidateMeal(queryClient, orgId)
    },
  })
}

export function useDeleteIndicator(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (!orgId) throw new Error('No organization')
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')

      const { error } = await supabase
        .from('indicator_definitions')
        .delete()
        .eq('id', id)
        .eq('organization_id', orgId)
      throwIfSupabaseError(error, 'api.deleteIndicator', { orgId, id })
    },
    onSuccess: () => {
      if (orgId) invalidateMeal(queryClient, orgId)
    },
  })
}

export function useUpsertLink(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (link: OutputIndicatorLink) => {
      if (!orgId) throw new Error('No organization')
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')

      const { error } = await supabase.from('output_indicator_links').upsert({
        output_id: link.outputId,
        indicator_id: link.indicatorId,
        weight: link.weight,
        note: link.note ?? null,
      })

      throwIfSupabaseError(error, 'api.upsertLink', { orgId })
    },
    onSuccess: () => {
      if (orgId) invalidateMeal(queryClient, orgId)
    },
  })
}

export function useDeleteLink(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ outputId, indicatorId }: { outputId: string; indicatorId: string }) => {
      if (!orgId) throw new Error('No organization')
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')

      const { error } = await supabase
        .from('output_indicator_links')
        .delete()
        .eq('output_id', outputId)
        .eq('indicator_id', indicatorId)

      throwIfSupabaseError(error, 'api.deleteLink', { orgId })
    },
    onSuccess: () => {
      if (orgId) invalidateMeal(queryClient, orgId)
    },
  })
}

export function useComputeIndicatorCurrent(orgId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (indicatorId: string) => {
      if (!orgId) throw new Error('No organization')
      const result = await invokeEdgeFunction<{ current: number; indicatorId: string }>(
        'compute-indicator-current',
        { organizationId: orgId, indicatorId },
      )
      return result
    },
    onSuccess: () => {
      if (orgId) invalidateMeal(queryClient, orgId)
    },
  })
}
