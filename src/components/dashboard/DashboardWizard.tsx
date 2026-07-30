import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DashboardDefinition } from '#/types/dashboard'
import {
  DASHBOARD_TEMPLATE_LIST,
  getLayoutWidgetsForTemplate,
  type DashboardTemplateId,
} from '#/lib/dashboardTemplates'
import { DashboardCanvas } from '#/components/dashboard/DashboardCanvas'
import { Button } from '#/components/ui/button'
import { useDashboardDraftStore } from '#/stores/dashboardDraftStore'

export type DashboardWizardMode = 'create' | 'manage'

const CREATE_LABELS = ['Basics', 'Template', 'Build', 'Review'] as const
const MANAGE_LABELS = ['Basics', 'Build', 'Review'] as const

export interface DashboardWizardProps {
  mode: DashboardWizardMode
  initialDraft: DashboardDefinition
  /** 0-based step within the flow for this mode */
  initialStepIndex?: number
  /** Persist to local draft storage (debounced). */
  onAutosave?: (next: DashboardDefinition) => void
  /** Push live (server / published catalog). */
  onPublish: (next: DashboardDefinition) => void | Promise<void>
  onCancel: () => void
  title: string
  subtitle?: string
}

export function DashboardWizard({
  mode,
  initialDraft,
  initialStepIndex = 0,
  onAutosave,
  onPublish,
  onCancel,
  title,
  subtitle,
}: DashboardWizardProps) {
  const labels = mode === 'create' ? CREATE_LABELS : MANAGE_LABELS
  const maxStep = labels.length - 1
  const saveDraft = useDashboardDraftStore((s) => s.saveDraft)

  const [stepIndex, setStepIndex] = useState(() =>
    Math.min(Math.max(0, initialStepIndex), maxStep),
  )
  const [draft, setDraft] = useState<DashboardDefinition>(() => ({
    ...initialDraft,
    status: 'draft',
  }))
  const [selectedTemplateId, setSelectedTemplateId] =
    useState<DashboardTemplateId>(() =>
      initialDraft.layout.length === 0 ? 'blank' : 'sample',
    )
  const [canvasKey, setCanvasKey] = useState(0)
  const [autosaveLabel, setAutosaveLabel] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)

  const applyTemplate = useCallback((id: DashboardTemplateId) => {
    setSelectedTemplateId(id)
    const { layout, widgets } = getLayoutWidgetsForTemplate(id)
    setDraft((d) => ({ ...d, layout, widgets, status: 'draft' }))
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

  // Local autosave (browser only)
  useEffect(() => {
    if (!draft.name.trim()) return
    const handle = window.setTimeout(() => {
      const next = { ...draft, status: 'draft' as const, updatedAt: new Date().toISOString() }
      saveDraft(next)
      onAutosave?.(next)
      setAutosaveLabel(`Draft saved locally · ${new Date().toLocaleTimeString()}`)
    }, 500)
    return () => window.clearTimeout(handle)
  }, [draft, saveDraft, onAutosave])

  const goNext = () => {
    if (!canGoNext) return
    if (stepIndex < maxStep) setStepIndex((s) => s + 1)
  }

  const goBack = () => {
    if (stepIndex > 0) setStepIndex((s) => s - 1)
  }

  const openPreview = () => {
    const next = { ...draft, status: 'draft' as const, updatedAt: new Date().toISOString() }
    saveDraft(next)
    window.open(`/dashboards/${draft.id}/preview`, '_blank', 'noopener,noreferrer')
  }

  const publish = async () => {
    setPublishing(true)
    try {
      const next: DashboardDefinition = {
        ...draft,
        status: 'published',
        updatedAt: new Date().toISOString(),
      }
      // Keep a local mirror so Preview still works offline after publish.
      saveDraft({ ...next, status: 'draft' })
      await onPublish(next)
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--sea-ink)]">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">{subtitle}</p>
          )}
          {autosaveLabel && (
            <p className="mt-1 text-[11px] text-[var(--sea-ink-soft)]">{autosaveLabel}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!draft.name.trim()}
            onClick={openPreview}
          >
            Preview
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!draft.name.trim() || publishing}
            onClick={() => void publish()}
          >
            {publishing ? 'Publishing…' : 'Publish live'}
          </Button>
        </div>
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
              Drafts autosave in this browser. Publish when you want the live version updated.
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
            {mode === 'create' && (
              <Button
                type="button"
                variant="outline"
                disabled={!canGoNext}
                onClick={() => {
                  applyTemplate('blank')
                  setStepIndex(labels.indexOf('Build'))
                }}
              >
                Skip to blank canvas
              </Button>
            )}
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
          <div className="-m-4 space-y-2 sm:-m-6 sm:space-y-3">
            <div className="px-4 pt-4 sm:px-6 sm:pt-6">
              <h2 className="text-lg font-semibold text-[var(--sea-ink)]">Build the layout</h2>
              <p className="text-sm text-[var(--sea-ink-soft)]">
                Add widgets, configure queries, drag to arrange. Changes autosave locally — use
                Preview or Publish when ready.
              </p>
            </div>
            <div className="px-2 pb-2 sm:px-3 sm:pb-3">
              <DashboardCanvas
                layout={draft.layout}
                widgets={draft.widgets}
                theme={draft.theme}
                onChange={({ layout, widgets, theme }) =>
                  setDraft((d) => ({
                    ...d,
                    layout,
                    widgets,
                    ...(theme ? { theme } : {}),
                  }))
                }
                layoutKey={`${draft.id}-${canvasKey}`}
              />
            </div>
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
              <div>
                <dt className="font-medium text-[var(--sea-ink-soft)]">Theme</dt>
                <dd className="capitalize text-[var(--sea-ink)]">
                  {draft.theme?.paletteId ?? 'lagoon'}
                </dd>
              </div>
            </dl>
            <p className="text-xs text-[var(--sea-ink-soft)]">
              Draft is autosaved in this browser. Publish live to update what others see (and the
              Open / share view).
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={openPreview}>
                Open preview tab
              </Button>
              <Button type="button" disabled={publishing} onClick={() => void publish()}>
                {publishing ? 'Publishing…' : 'Publish live'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Close
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
            <Button type="button" disabled={publishing} onClick={() => void publish()}>
              {publishing ? 'Publishing…' : 'Publish live'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
