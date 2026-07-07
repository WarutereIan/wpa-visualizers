import { createFileRoute } from '@tanstack/react-router'
import {
  MealProjectToolbar,
  NewOutputForm,
  OutputEditForm,
  OutputEditorActions,
  ProjectEditForm,
  ProjectSelect,
} from '#/components/outputs/MealForms'
import { OutputContributionVisualizer } from '#/components/outputs/OutputContributionVisualizer'
import { OutputsComparisonChart } from '#/components/outputs/OutputsComparisonChart'
import { useWorkspaceMeal } from '#/hooks/useWorkspaceMeal'
import type { OutputStatus } from '#/types/outputsIndicators'

export const Route = createFileRoute('/outputs-and-indicators/outputs')({
  component: OutputsPage,
})

const statusLabel: Record<OutputStatus, string> = {
  planned: 'Planned',
  in_progress: 'In progress',
  completed: 'Completed',
  at_risk: 'At risk',
}

const statusClass: Record<OutputStatus, string> = {
  planned: 'bg-[var(--sea-ink-soft)]/15 text-[var(--sea-ink)]',
  in_progress: 'bg-[rgba(79,184,178,0.2)] text-[var(--lagoon-deep)]',
  completed: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
  at_risk: 'bg-amber-500/15 text-amber-900 dark:text-amber-200',
}

function OutputsPage() {
  const meal = useWorkspaceMeal()
  const { selectedProjectId, projects, outputs, links, indicators, loading } = meal

  const filtered =
    selectedProjectId === null || selectedProjectId === ''
      ? outputs
      : outputs.filter((o) => o.projectId === selectedProjectId)

  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 text-sm text-[var(--sea-ink-soft)]">
        Loading MEAL data…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-[var(--sea-ink)]">Outputs</h2>
          <p className="text-sm text-[var(--sea-ink-soft)]">
            Each card shows linked indicators, a donut mix of <strong>weight × achievement</strong>, and the{' '}
            <strong>composite score</strong> (weighted mean % toward targets).
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <ProjectSelect />
          <MealProjectToolbar />
          {selectedProjectId && projects.find((p) => p.id === selectedProjectId) && (
            <ProjectEditForm project={projects.find((p) => p.id === selectedProjectId)!} />
          )}
          <NewOutputForm projectId={selectedProjectId} />
        </div>
      </div>

      {filtered.length > 0 && (
        <OutputsComparisonChart outputs={filtered} links={links} indicators={indicators} />
      )}

      <div className="grid gap-6">
        {filtered.map((o) => {
          const project = projects.find((p) => p.id === o.projectId)
          return (
            <div key={o.id}>
              <OutputContributionVisualizer
                output={o}
                project={project}
                links={links}
                indicators={indicators}
                statusLabel={statusLabel}
                statusClass={statusClass}
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <OutputEditForm output={o} />
                <OutputEditorActions outputId={o.id} />
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-8 text-center text-sm text-[var(--sea-ink-soft)]">
          No outputs for this filter.
        </div>
      )}
    </div>
  )
}
