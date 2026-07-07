import { useCallback, useMemo } from 'react'
import {
  useComputeIndicatorCurrent,
  useCreateIndicator,
  useCreateOutput,
  useCreateProject,
  useDeleteIndicator,
  useDeleteLink,
  useDeleteOutput,
  useDeleteProject,
  useMealBundle,
  useUpdateIndicator,
  useUpdateOutput,
  useUpdateProject,
  useUpsertLink,
} from '#/lib/api/meal'
import { useOrgId, useWorkspaceReady } from '#/lib/api/workspace'
import { useSelectedProject } from '#/hooks/useSelectedProject'
import { useOutputsIndicatorsStore } from '#/stores/outputsIndicatorsStore'
import type {
  OutputIndicatorLink,
  OutputStatus,
  ProjectStatus,
  WpaIndicator,
  WpaOutput,
  WpaProject,
} from '#/types/outputsIndicators'

export function useWorkspaceMeal() {
  const workspaceReady = useWorkspaceReady()
  const orgId = useOrgId()
  const { selectedProjectId, setSelectedProjectId, isLoading: prefsLoading } = useSelectedProject()

  const demoProjects = useOutputsIndicatorsStore((s) => s.projects)
  const demoOutputs = useOutputsIndicatorsStore((s) => s.outputs)
  const demoIndicators = useOutputsIndicatorsStore((s) => s.indicators)
  const demoLinks = useOutputsIndicatorsStore((s) => s.links)
  const demoOutputsForIndicator = useOutputsIndicatorsStore((s) => s.outputsForIndicator)
  const demoIndicatorsForOutput = useOutputsIndicatorsStore((s) => s.indicatorsForOutput)

  const mealQuery = useMealBundle(workspaceReady ? orgId : null)
  const createProject = useCreateProject(workspaceReady ? orgId : null)
  const updateProject = useUpdateProject(workspaceReady ? orgId : null)
  const deleteProject = useDeleteProject(workspaceReady ? orgId : null)
  const createOutput = useCreateOutput(workspaceReady ? orgId : null)
  const updateOutput = useUpdateOutput(workspaceReady ? orgId : null)
  const deleteOutput = useDeleteOutput(workspaceReady ? orgId : null)
  const createIndicator = useCreateIndicator(workspaceReady ? orgId : null)
  const updateIndicator = useUpdateIndicator(workspaceReady ? orgId : null)
  const deleteIndicator = useDeleteIndicator(workspaceReady ? orgId : null)
  const upsertLink = useUpsertLink(workspaceReady ? orgId : null)
  const deleteLink = useDeleteLink(workspaceReady ? orgId : null)
  const computeCurrent = useComputeIndicatorCurrent(workspaceReady ? orgId : null)

  const bundle = mealQuery.data
  const projects = workspaceReady ? (bundle?.projects ?? []) : demoProjects
  const outputs = workspaceReady ? (bundle?.outputs ?? []) : demoOutputs
  const indicators = workspaceReady ? (bundle?.indicators ?? []) : demoIndicators
  const links = workspaceReady ? (bundle?.links ?? []) : demoLinks

  const outputsForIndicator = useCallback(
    (indicatorId: string) => {
      if (!workspaceReady) return demoOutputsForIndicator(indicatorId)
      const outIds = new Set(links.filter((l) => l.indicatorId === indicatorId).map((l) => l.outputId))
      return outputs.filter((o) => outIds.has(o.id))
    },
    [workspaceReady, demoOutputsForIndicator, links, outputs],
  )

  const indicatorsForOutput = useCallback(
    (outputId: string) => {
      if (!workspaceReady) return demoIndicatorsForOutput(outputId)
      const indIds = new Set(links.filter((l) => l.outputId === outputId).map((l) => l.indicatorId))
      return indicators.filter((i) => indIds.has(i.id))
    },
    [workspaceReady, demoIndicatorsForOutput, links, indicators],
  )

  const getProject = useCallback(
    (id: string) => projects.find((p) => p.id === id),
    [projects],
  )

  const canEdit = workspaceReady

  return useMemo(
    () => ({
      workspaceReady,
      canEdit,
      loading: workspaceReady ? mealQuery.isLoading || prefsLoading : false,
      projects,
      outputs,
      indicators,
      links,
      selectedProjectId,
      setSelectedProjectId,
      getProject,
      outputsForIndicator,
      indicatorsForOutput,
      createProject: async (input: {
        name: string
        code?: string
        program?: string
        description?: string
        status?: ProjectStatus
        startDate?: string | null
        endDate?: string | null
      }) => {
        if (!workspaceReady) throw new Error('Sign in to create projects')
        return createProject.mutateAsync(input)
      },
      updateProject: async (id: string, patch: Partial<WpaProject>) => {
        if (!workspaceReady) throw new Error('Sign in to edit projects')
        return updateProject.mutateAsync({ id, patch })
      },
      deleteProject: async (id: string) => {
        if (!workspaceReady) throw new Error('Sign in to delete projects')
        return deleteProject.mutateAsync(id)
      },
      createOutput: async (input: Omit<WpaOutput, 'id'>) => {
        if (!workspaceReady) throw new Error('Sign in to create outputs')
        return createOutput.mutateAsync(input)
      },
      updateOutput: async (id: string, patch: Partial<WpaOutput>) => {
        if (!workspaceReady) throw new Error('Sign in to edit outputs')
        return updateOutput.mutateAsync({ id, patch })
      },
      deleteOutput: async (id: string) => {
        if (!workspaceReady) throw new Error('Sign in to delete outputs')
        return deleteOutput.mutateAsync(id)
      },
      createIndicator: async (input: Omit<WpaIndicator, 'id'>) => {
        if (!workspaceReady) throw new Error('Sign in to create indicators')
        return createIndicator.mutateAsync(input)
      },
      updateIndicator: async (id: string, patch: Partial<WpaIndicator>) => {
        if (!workspaceReady) throw new Error('Sign in to edit indicators')
        return updateIndicator.mutateAsync({ id, patch })
      },
      deleteIndicator: async (id: string) => {
        if (!workspaceReady) throw new Error('Sign in to delete indicators')
        return deleteIndicator.mutateAsync(id)
      },
      upsertLink: async (link: OutputIndicatorLink) => {
        if (!workspaceReady) throw new Error('Sign in to edit links')
        return upsertLink.mutateAsync(link)
      },
      deleteLink: async (outputId: string, indicatorId: string) => {
        if (!workspaceReady) throw new Error('Sign in to edit links')
        return deleteLink.mutateAsync({ outputId, indicatorId })
      },
      computeIndicatorCurrent: async (indicatorId: string) => {
        if (!workspaceReady) throw new Error('Sign in to compute indicators')
        return computeCurrent.mutateAsync(indicatorId)
      },
    }),
    [
      workspaceReady,
      canEdit,
      mealQuery.isLoading,
      prefsLoading,
      projects,
      outputs,
      indicators,
      links,
      selectedProjectId,
      setSelectedProjectId,
      getProject,
      outputsForIndicator,
      indicatorsForOutput,
      createProject,
      updateProject,
      deleteProject,
      createOutput,
      updateOutput,
      deleteOutput,
      createIndicator,
      updateIndicator,
      deleteIndicator,
      upsertLink,
      deleteLink,
      computeCurrent,
    ],
  )
}
