import { useMemo, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  NewIndicatorForm,
  NewOutputForm,
  IndicatorEditForm,
  IndicatorEditorActions,
  IndicatorLinkManager,
  OutputEditForm,
  OutputEditorActions,
  ProjectEditForm,
} from '#/components/outputs/MealForms'
import { OutputContributionVisualizer } from '#/components/outputs/OutputContributionVisualizer'
import {
  IndicatorGauge,
  IndicatorsRadarChart,
  IndicatorsValueComparisonChart,
} from '#/components/outputs/IndicatorsPortfolioCharts'
import { useWorkspaceData } from '#/hooks/useWorkspaceData'
import { useWorkspaceMeal } from '#/hooks/useWorkspaceMeal'
import { indicatorProgressPercent } from '#/lib/outputIndicatorMath'
import { Button } from '#/components/ui/button'
import {
  INDICATOR_TYPE_LABELS,
  type OutputStatus,
  type ProjectStatus,
} from '#/types/outputsIndicators'

export const Route = createFileRoute('/projects/$projectId')({
  component: ProjectDetailPage,
})

type Tab = 'overview' | 'outputs' | 'indicators' | 'links'

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
const projectStatusLabel: Record<ProjectStatus, string> = {
  planned: 'Planned',
  in_progress: 'In progress',
  completed: 'Completed',
  at_risk: 'At risk',
}

function ProjectDetailPage() {
  const { projectId } = Route.useParams()
  const meal = useWorkspaceMeal()
  const { queries } = useWorkspaceData()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('overview')

  const project = meal.getProject(projectId)

  const projectOutputs = useMemo(
    () => meal.outputs.filter((o) => o.projectId === projectId),
    [meal.outputs, projectId],
  )
  const projectIndicators = useMemo(
    () => meal.indicators.filter((i) => i.projectId === projectId),
    [meal.indicators, projectId],
  )
  const projectLinks = useMemo(
    () => meal.links.filter((l) =>
      projectOutputs.some((o) => o.id === l.outputId) &&
      projectIndicators.some((i) => i.id === l.indicatorId),
    ),
    [meal.links, projectOutputs, projectIndicators],
  )

  if (meal.loading) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 text-sm text-[var(--sea-ink-soft)]">
        Loading project…
      </div>
    )
  }

  if (!project) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-8 text-center">
        <p className="text-[var(--sea-ink)]">This project does not exist (or was removed).</p>
        <Button asChild className="mt-4">
          <Link to="/projects">Back to projects</Link>
        </Button>
      </div>
    )
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'overview', label: 'Overview', count: 0 },
    { id: 'outputs', label: 'Outputs', count: projectOutputs.length },
    { id: 'indicators', label: 'Indicators', count: projectIndicators.length },
    { id: 'links', label: 'Links', count: projectLinks.length },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm text-[var(--sea-ink-soft)]">
          <Link to="/projects" className="hover:text-[var(--sea-ink)]">Projects</Link>
          <span>/</span>
          <span className="text-[var(--sea-ink)]">{project.name}</span>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-[var(--sea-ink)]">{project.name}</h1>
            <p className="mt-1 font-mono text-xs text-[var(--sea-ink-soft)]">
              {project.code ?? '—'}
              {project.program ? ` · ${project.program}` : ''}
              {' · '}
              {projectStatusLabel[project.status]}
            </p>
            {project.description && (
              <p className="mt-2 max-w-3xl text-sm text-[var(--sea-ink-soft)]">{project.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ProjectEditForm project={project} />
            {meal.canEdit && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  if (!confirm(`Delete project “${project.name}”? This removes its outputs and links.`)) return
                  void meal.deleteProject(project.id).then(() => navigate({ to: '/projects' }))
                }}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      <nav className="flex flex-wrap gap-1 border-b border-[var(--line)]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'border-[var(--lagoon-deep)] text-[var(--lagoon-deep)]'
                : 'border-transparent text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1.5 rounded-full bg-[var(--bg-base)] px-1.5 py-0.5 text-xs tabular-nums">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </nav>

      {tab === 'overview' && (
        <OverviewTab
          outputs={projectOutputs}
          indicators={projectIndicators}
        />
      )}

      {tab === 'outputs' && (
        <div className="space-y-4">
          <NewOutputForm projectId={projectId} />
          {projectOutputs.length === 0 ? (
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-8 text-center text-sm text-[var(--sea-ink-soft)]">
              No outputs yet for this project.
            </div>
          ) : (
            <div className="grid gap-6">
              {projectOutputs.map((o) => (
                <div key={o.id} className="space-y-2">
                  <OutputContributionVisualizer
                    output={o}
                    project={project}
                    links={meal.links}
                    indicators={meal.indicators}
                    statusLabel={statusLabel}
                    statusClass={statusClass}
                  />
                  <div className="flex justify-end gap-2">
                    <OutputEditForm output={o} />
                    <OutputEditorActions outputId={o.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'indicators' && (
        <div className="space-y-4">
          <NewIndicatorForm projectId={projectId} />
          {projectIndicators.length > 0 && (
            <div className="grid gap-6 xl:grid-cols-2">
              <IndicatorsRadarChart indicators={projectIndicators} />
              <IndicatorsValueComparisonChart indicators={projectIndicators} />
            </div>
          )}
          {projectIndicators.length === 0 ? (
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-8 text-center text-sm text-[var(--sea-ink-soft)]">
              No indicators yet for this project.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {projectIndicators.map((ind) => {
                const progPct = indicatorProgressPercent(ind)
                const progressBar = Math.min(100, Math.round(progPct))
                const outs = meal.outputsForIndicator(ind.id)
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
                              {ind.location && (
                                <span className="ml-2 font-normal text-[var(--sea-ink-soft)]">· {ind.location}</span>
                              )}
                            </h3>
                            <p className="mt-0.5 text-xs text-[var(--sea-ink-soft)]">
                              {INDICATOR_TYPE_LABELS[ind.type] ?? ind.type}
                              {ind.unit ? ` · ${ind.unit}` : ''}
                              {ind.period ? ` · ${ind.period}` : ''}
                            </p>
                          </div>
                        </div>
                        <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <dt className="text-[var(--sea-ink-soft)]">Baseline</dt>
                            <dd className="font-medium text-[var(--sea-ink)]">{ind.baseline ?? '—'}</dd>
                          </div>
                          <div>
                            <dt className="text-[var(--sea-ink-soft)]">Current</dt>
                            <dd className="font-medium text-[var(--sea-ink)]">{ind.current ?? '—'}</dd>
                          </div>
                          <div>
                            <dt className="text-[var(--sea-ink-soft)]">Target</dt>
                            <dd className="font-medium text-[var(--sea-ink)]">{ind.target ?? '—'}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-xs text-[var(--sea-ink-soft)]">
                        <span>Progress to target ({progPct}%)</span>
                        <span>{progressBar}%</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--bg-base)] ring-1 ring-[var(--line)]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[var(--lagoon-deep)] to-[var(--lagoon)]"
                          style={{ width: `${progressBar}%` }}
                        />
                      </div>
                    </div>
                    <IndicatorEditorActions
                      indicatorId={ind.id}
                      sourceQueryId={ind.sourceQueryId}
                      queries={queries.map((q) => ({ id: q.id, name: q.name }))}
                      onSourceQueryChange={(queryId) => {
                        void meal.updateIndicator(ind.id, { sourceQueryId: queryId })
                      }}
                    />
                    <IndicatorEditForm indicator={ind} />
                    <IndicatorLinkManager
                      indicatorId={ind.id}
                      linkedOutputs={outs}
                      outputs={projectOutputs}
                    />
                  </article>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'links' && (
        <LinksTab
          outputs={projectOutputs}
          indicators={projectIndicators}
          links={projectLinks}
          onUnlink={(outputId, indicatorId) => void meal.deleteLink(outputId, indicatorId)}
          canEdit={meal.canEdit}
        />
      )}
    </div>
  )
}

function OverviewTab({
  outputs,
  indicators,
}: {
  outputs: { id: string; title: string; status: OutputStatus; location: string | null }[]
  indicators: { id: string; name: string; location: string | null; current: number | null; target: number | null }[]
}) {
  const avgProgress =
    indicators.length > 0
      ? Math.round(
          indicators.reduce((s, i) => {
            const t = i.target ?? 0
            return s + (t > 0 ? Math.min(1, (i.current ?? 0) / t) : 0)
          }, 0) / indicators.length * 1000,
        ) / 10
      : null

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <dl className="grid grid-cols-2 gap-3 lg:col-span-3">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4">
          <dt className="text-xs text-[var(--sea-ink-soft)]">Outputs</dt>
          <dd className="mt-1 text-2xl font-bold text-[var(--sea-ink)]">{outputs.length}</dd>
        </div>
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4">
          <dt className="text-xs text-[var(--sea-ink-soft)]">Indicators</dt>
          <dd className="mt-1 text-2xl font-bold text-[var(--sea-ink)]">{indicators.length}</dd>
        </div>
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4">
          <dt className="text-xs text-[var(--sea-ink-soft)]">Avg. progress</dt>
          <dd className="mt-1 text-2xl font-bold text-[var(--lagoon-deep)]">
            {avgProgress == null ? '—' : `${avgProgress}%`}
          </dd>
        </div>
      </dl>

      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 lg:col-span-2">
        <h3 className="text-sm font-semibold text-[var(--sea-ink)]">Recent outputs</h3>
        {outputs.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--sea-ink-soft)]">No outputs yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {outputs.slice(0, 5).map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-[var(--sea-ink)]">{o.title}</span>
                <span className="shrink-0 text-xs text-[var(--sea-ink-soft)]">
                  {o.location ?? '—'} · {statusLabel[o.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4">
        <h3 className="text-sm font-semibold text-[var(--sea-ink)]">Indicators</h3>
        {indicators.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--sea-ink-soft)]">No indicators yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {indicators.slice(0, 5).map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-[var(--sea-ink)]">
                  {i.name}
                  {i.location ? ` · ${i.location}` : ''}
                </span>
                <span className="shrink-0 text-xs text-[var(--sea-ink-soft)]">
                  {i.current ?? '—'} / {i.target ?? '—'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function LinksTab({
  outputs,
  indicators,
  links,
  onUnlink,
  canEdit,
}: {
  outputs: { id: string; title: string }[]
  indicators: { id: string; name: string; location: string | null }[]
  links: { outputId: string; indicatorId: string; weight: number }[]
  onUnlink: (outputId: string, indicatorId: string) => void
  canEdit: boolean
}) {
  const outputName = (id: string) => outputs.find((o) => o.id === id)?.title ?? id
  const indicatorName = (id: string) => {
    const i = indicators.find((x) => x.id === id)
    return i ? `${i.name}${i.location ? ` · ${i.location}` : ''}` : id
  }

  if (links.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-8 text-center text-sm text-[var(--sea-ink-soft)]">
        No output↔indicator links yet. Open the Indicators tab to link outputs to indicators.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--surface-strong)]">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-[var(--line)] text-[var(--sea-ink-soft)]">
          <tr>
            <th className="px-4 py-3 font-medium">Output</th>
            <th className="px-4 py-3 font-medium">Indicator</th>
            <th className="px-4 py-3 font-medium">Weight</th>
            {canEdit && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody>
          {links.map((l, idx) => (
            <tr key={`${l.outputId}-${l.indicatorId}-${idx}`} className="border-b border-[var(--line)] last:border-0">
              <td className="px-4 py-3 text-[var(--sea-ink)]">{outputName(l.outputId)}</td>
              <td className="px-4 py-3 text-[var(--sea-ink)]">{indicatorName(l.indicatorId)}</td>
              <td className="px-4 py-3 font-mono text-[var(--sea-ink-soft)]">{l.weight}</td>
              {canEdit && (
                <td className="px-4 py-3 text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (!confirm('Unlink this output from the indicator?')) return
                      onUnlink(l.outputId, l.indicatorId)
                    }}
                  >
                    Unlink
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
