import { useCallback, useMemo, useState } from 'react'
import type { DashboardDefinition } from '#/types/dashboard'
import {
  DASHBOARD_TEMPLATE_LIST,
  getLayoutWidgetsForTemplate,
  type DashboardTemplateId,
} from '#/lib/dashboardTemplates'
import { DashboardCanvas } from '#/components/dashboard/DashboardCanvas'
import { Button } from '#/components/ui/button'

export type DashboardWizardMode = 'create' | 'manage'

const CREATE_LABELS = ['Basics', 'Template', 'Build', 'Review'] as const
const MANAGE_LABELS = ['Basics', 'Build', 'Review'] as const

export interface DashboardWizardProps {
  mode: DashboardWizardMode
  initialDraft: DashboardDefinition
  /** 0-based step within the flow for this mode */
  initialStepIndex?: number
  onComplete: (next: DashboardDefinition) => void
  onCancel: () => void
  title: string
  subtitle?: string
}

export function DashboardWizard({
  mode,
  initialDraft,
  initialStepIndex = 0,
  onComplete,
  onCancel,
  title,
  subtitle,
}: DashboardWizardProps) {
  const labels = mode === 'create' ? CREATE_LABELS : MANAGE_LABELS
  const maxStep = labels.length - 1

  const [stepIndex, setStepIndex] = useState(() =>
    Math.min(Math.max(0, initialStepIndex), maxStep),
  )
  const [draft, setDraft] = useState<DashboardDefinition>(initialDraft)
  const [selectedTemplateId, setSelectedTemplateId] =
    useState<DashboardTemplateId>(() =>
      initialDraft.layout.length === 0 ? 'blank' : 'sample',
    )
  const [canvasKey, setCanvasKey] = useState(0)

  const applyTemplate = useCallback((id: DashboardTemplateId) => {
    setSelectedTemplateId(id)
    const { layout, widgets } = getLayoutWidgetsForTemplate(id)
    setDraft((d) => ({ ...d, layout, widgets }))
    setCanvasKey((k) => k + 1)
  }, [])

  const mapStepToKind = useCallback(
    (idx: number): 'basics' | 'template' | 'build' | 'review' => {
      if (mode === 'create') {
        return ['basics', 'template', 'build', 'review'][idx] as
          | 'basics'
          | 'template'
          | 'build'
          | 'review'
      }
      return ['basics', 'build', 'review'][idx] as 'basics' | 'build' | 'review'
    },
    [mode],
  )

  const currentKind = mapStepToKind(stepIndex)

  const canGoNext = useMemo(() => {
    if (currentKind === 'basics') {
      return draft.name.trim().length > 0
    }
    return true
  }, [currentKind, draft.name])

  const goNext = () => {
    if (!canGoNext) return
    if (stepIndex < maxStep) setStepIndex((s) => s + 1)
  }

  const goBack = () => {
    if (stepIndex > 0) setStepIndex((s) => s - 1)
  }

  const finish = () => {
    onComplete({
      ...draft,
      updatedAt: new Date().toISOString(),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--sea-ink)]">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">{subtitle}</p>
        )}
      </div>

      {/* Step indicator */}
      <nav aria-label="Wizard progress" className="flex flex-wrap gap-2">
        {labels.map((label, i) => {
          const done = i < stepIndex
          const active = i === stepIndex
          return (
            <div
              key={label}
              className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
                active
                  ? 'border-[var(--lagoon)] bg-[rgba(79,184,178,0.15)] text-[var(--lagoon-deep)]'
                  : done
                    ? 'border-[var(--line)] bg-[var(--surface-strong)] text-[var(--sea-ink)]'
                    : 'border-[var(--line)] text-[var(--sea-ink-soft)]'
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                  active || done ? 'bg-[var(--lagoon)] text-white' : 'bg-[var(--sand)]'
                }`}
              >
                {done ? '✓' : i + 1}
              </span>
              {label}
            </div>
          )
        })}
      </nav>

      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 sm:p-6">
        {currentKind === 'basics' && (
          <div className="mx-auto max-w-lg space-y-4">
            <h2 className="text-lg font-semibold text-[var(--sea-ink)]">
              Dashboard details
            </h2>
            <p className="text-sm text-[var(--sea-ink-soft)]">
              Name and describe this dashboard. You can change these later from the management
              wizard.
            </p>
            <div>
              <label htmlFor="wiz-name" className="text-sm font-medium text-[var(--sea-ink)]">
                Name <span className="text-red-600">*</span>
              </label>
              <input
                id="wiz-name"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                className="mt-1 flex h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm"
                placeholder="e.g. Country program overview"
              />
            </div>
            <div>
              <label htmlFor="wiz-desc" className="text-sm font-medium text-[var(--sea-ink)]">
                Description
              </label>
              <textarea
                id="wiz-desc"
                value={draft.description ?? ''}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, description: e.target.value }))
                }
                rows={3}
                className="mt-1 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
                placeholder="Optional context for your team"
              />
            </div>
          </div>
        )}

        {currentKind === 'template' && mode === 'create' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[var(--sea-ink)]">
              Choose a starting template
            </h2>
            <p className="text-sm text-[var(--sea-ink-soft)]">
              Pick a layout preset. You can add, remove, and resize widgets on the next step.
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {DASHBOARD_TEMPLATE_LIST.map((t) => {
                const selected = selectedTemplateId === t.id
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => applyTemplate(t.id)}
                      className={`w-full rounded-xl border-2 p-4 text-left transition ${
                        selected
                          ? 'border-[var(--lagoon)] bg-[rgba(79,184,178,0.08)]'
                          : 'border-[var(--line)] bg-[var(--surface)] hover:border-[var(--lagoon)]/50'
                      }`}
                    >
                      <span className="font-semibold text-[var(--sea-ink)]">{t.name}</span>
                      <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">{t.description}</p>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {currentKind === 'build' && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--sea-ink)]">
              Build the layout
            </h2>
            <p className="text-sm text-[var(--sea-ink-soft)]">
              Drag widgets, resize, and configure titles. Changes apply to your draft until you
              finish.
            </p>
            <DashboardCanvas
              layout={draft.layout}
              widgets={draft.widgets}
              onChange={({ layout, widgets }) =>
                setDraft((d) => ({ ...d, layout, widgets }))
              }
              layoutKey={`${draft.id}-${canvasKey}`}
            />
          </div>
        )}

        {currentKind === 'review' && (
          <div className="mx-auto max-w-xl space-y-4">
            <h2 className="text-lg font-semibold text-[var(--sea-ink)]">Review</h2>
            <dl className="space-y-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 text-sm">
              <div>
                <dt className="font-medium text-[var(--sea-ink-soft)]">Name</dt>
                <dd className="text-[var(--sea-ink)]">{draft.name}</dd>
              </div>
              <div>
                <dt className="font-medium text-[var(--sea-ink-soft)]">Description</dt>
                <dd className="text-[var(--sea-ink)]">
                  {draft.description?.trim() ? draft.description : '—'}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-[var(--sea-ink-soft)]">Widgets</dt>
                <dd className="text-[var(--sea-ink)]">{draft.layout.length} on canvas</dd>
              </div>
            </dl>
            <p className="text-xs text-[var(--sea-ink-soft)]">
              {mode === 'create'
                ? 'Saving will add this dashboard to your list (browser storage until an API is connected).'
                : 'Saving will update this dashboard in your list.'}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <div className="flex gap-2">
          {stepIndex > 0 && (
            <Button type="button" variant="outline" onClick={goBack}>
              Back
            </Button>
          )}
          {stepIndex < maxStep ? (
            <Button type="button" onClick={goNext} disabled={!canGoNext}>
              Next
            </Button>
          ) : (
            <Button type="button" onClick={finish}>
              {mode === 'create' ? 'Create dashboard' : 'Save changes'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
