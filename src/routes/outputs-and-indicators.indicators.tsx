import { createFileRoute } from '@tanstack/react-router'
import {
  IndicatorEditForm,
  IndicatorEditorActions,
  IndicatorLinkManager,
  NewIndicatorForm,
  ProjectSelect,
} from '#/components/outputs/MealForms'
import {
  IndicatorGauge,
  IndicatorsRadarChart,
  IndicatorsValueComparisonChart,
} from '#/components/outputs/IndicatorsPortfolioCharts'
import { useWorkspaceData } from '#/hooks/useWorkspaceData'
import { useWorkspaceMeal } from '#/hooks/useWorkspaceMeal'
import { indicatorProgressPercent } from '#/lib/outputIndicatorMath'

export const Route = createFileRoute('/outputs-and-indicators/indicators')({
  component: IndicatorsPage,
})

function IndicatorsPage() {
  const meal = useWorkspaceMeal()
  const { queries } = useWorkspaceData()
  const {
    selectedProjectId,
    projects,
    indicators,
    outputs,
    outputsForIndicator,
    loading,
    updateIndicator,
  } = meal

  const filtered =
    selectedProjectId === null || selectedProjectId === ''
      ? indicators
      : indicators.filter((i) => i.projectId === selectedProjectId)

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
          <h2 className="text-base font-semibold text-[var(--sea-ink)]">Indicators</h2>
          <p className="text-sm text-[var(--sea-ink-soft)]">
            Portfolio charts plus per-indicator gauges. Link a saved query to compute{' '}
            <strong>current</strong> from imported data (MEAL catalog — separate from imported indicator datasets).
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <ProjectSelect />
          <NewIndicatorForm projectId={selectedProjectId} />
        </div>
      </div>

      {filtered.length > 0 && (
        <div className="grid gap-6 xl:grid-cols-2">
          <IndicatorsRadarChart indicators={filtered} />
          <IndicatorsValueComparisonChart indicators={filtered} />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((ind) => {
          const project = projects.find((p) => p.id === ind.projectId)
          const outs = outputsForIndicator(ind.id)
          const progPct = indicatorProgressPercent(ind)
          const progressBar = Math.min(100, Math.round(progPct))

          return (
            <article
              key={ind.id}
              className="flex flex-col rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 shadow-sm"
            >
              <div className="flex flex-wrap gap-4">
                <IndicatorGauge ind={ind} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-[var(--sea-ink)]">
                        {ind.name}
                        <span className="ml-2 font-normal text-[var(--sea-ink-soft)]">· {ind.location}</span>
                      </h3>
                      {project && (
                        <p className="mt-0.5 text-xs text-[var(--sea-ink-soft)]">
                          {project.code} · {project.name}
                        </p>
                      )}
                    </div>
                    <span className="rounded-md bg-[var(--bg-base)] px-2 py-0.5 text-xs font-mono text-[var(--sea-ink-soft)]">
                      {ind.period}
                    </span>
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                    <div>
                      <dt className="text-[var(--sea-ink-soft)]">Unit</dt>
                      <dd className="font-medium text-[var(--sea-ink)]">{ind.unit}</dd>
                    </div>
                    <div>
                      <dt className="text-[var(--sea-ink-soft)]">Baseline</dt>
                      <dd className="font-medium text-[var(--sea-ink)]">{ind.baseline}</dd>
                    </div>
                    <div>
                      <dt className="text-[var(--sea-ink-soft)]">Current</dt>
                      <dd className="font-medium text-[var(--sea-ink)]">{ind.current}</dd>
                    </div>
                    <div>
                      <dt className="text-[var(--sea-ink-soft)]">Target</dt>
                      <dd className="font-medium text-[var(--sea-ink)]">{ind.target}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-[var(--sea-ink-soft)]">
                  <span>Linear progress to target ({progPct}%)</span>
                  <span>{progressBar}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[var(--bg-base)] ring-1 ring-[var(--line)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--lagoon-deep)] to-[var(--lagoon)] transition-[width]"
                    style={{ width: `${progressBar}%` }}
                  />
                </div>
              </div>

              <IndicatorEditorActions
                indicatorId={ind.id}
                sourceQueryId={ind.sourceQueryId}
                queries={queries.map((q) => ({ id: q.id, name: q.name }))}
                onSourceQueryChange={(queryId) => {
                  void updateIndicator(ind.id, { sourceQueryId: queryId })
                }}
              />

              <IndicatorEditForm indicator={ind} />

              <IndicatorLinkManager
                indicatorId={ind.id}
                linkedOutputs={outs}
                outputs={selectedProjectId ? outputs.filter((o) => o.projectId === selectedProjectId) : outputs}
              />
            </article>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-8 text-center text-sm text-[var(--sea-ink-soft)]">
          No indicators for this filter.
        </div>
      )}
    </div>
  )
}
