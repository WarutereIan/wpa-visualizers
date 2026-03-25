import { createFileRoute } from '@tanstack/react-router'
import { OutputContributionVisualizer } from '#/components/outputs/OutputContributionVisualizer'
import { OutputsComparisonChart } from '#/components/outputs/OutputsComparisonChart'
import { ProjectSelect } from '#/components/outputs/ProjectSelect'
import { useOutputsIndicatorsStore } from '#/stores/outputsIndicatorsStore'
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
  const selectedProjectId = useOutputsIndicatorsStore((s) => s.selectedProjectId)
  const projects = useOutputsIndicatorsStore((s) => s.projects)
  const outputs = useOutputsIndicatorsStore((s) => s.outputs)
  const links = useOutputsIndicatorsStore((s) => s.links)
  const indicators = useOutputsIndicatorsStore((s) => s.indicators)

  const filtered =
    selectedProjectId === null || selectedProjectId === ''
      ? outputs
      : outputs.filter((o) => o.projectId === selectedProjectId)

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
        <ProjectSelect />
      </div>

      {filtered.length > 0 && (
        <OutputsComparisonChart outputs={filtered} links={links} indicators={indicators} />
      )}

      <div className="grid gap-6">
        {filtered.map((o) => {
          const project = projects.find((p) => p.id === o.projectId)
          return (
            <OutputContributionVisualizer
              key={o.id}
              output={o}
              project={project}
              links={links}
              indicators={indicators}
              statusLabel={statusLabel}
              statusClass={statusClass}
            />
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
