import { useState } from 'react'
import { Button } from '#/components/ui/button'
import { useWorkspaceMeal } from '#/hooks/useWorkspaceMeal'
import { useSelectedProject } from '#/hooks/useSelectedProject'
import {
  INDICATOR_TYPES,
  INDICATOR_TYPE_LABELS,
  type IndicatorType,
  type OutputStatus,
  type ProjectStatus,
  type Indicator,
  type Output,
  type Project,
} from '#/types/outputsIndicators'

const outputStatuses: OutputStatus[] = ['planned', 'in_progress', 'completed', 'at_risk']
const projectStatuses: ProjectStatus[] = ['planned', 'in_progress', 'completed', 'at_risk']

function fieldClass() {
  return 'mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm'
}

function useMutationError() {
  return useState<string | null>(null)
}

export function ProjectSelect() {
  const { projects } = useWorkspaceMeal()
  const { selectedProjectId, setSelectedProjectId } = useSelectedProject(projects)

  return (
    <label className="flex flex-col gap-1.5 text-sm sm:flex-row sm:items-center sm:gap-3">
      <span className="shrink-0 font-medium text-[var(--sea-ink)]">Project</span>
      <select
        className="min-w-[min(100%,280px)] rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-[var(--sea-ink)] outline-none focus:ring-2 focus:ring-[var(--lagoon)]"
        value={selectedProjectId ?? ''}
        onChange={(e) => setSelectedProjectId(e.target.value || null)}
      >
        <option value="">All projects</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.code} — {p.name}
          </option>
        ))}
      </select>
    </label>
  )
}

export function NewOutputForm({ projectId }: { projectId: string | null }) {
  const meal = useWorkspaceMeal()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [status, setStatus] = useState<OutputStatus>('planned')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useMutationError()

  if (!meal.canEdit || !projectId) return null

  return (
    <div>
      <Button type="button" size="sm" onClick={() => setOpen((v) => !v)}>
        {open ? 'Cancel' : 'New output'}
      </Button>
      {open && (
        <form
          className="mt-3 grid gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!title.trim()) return
            setSaving(true)
            setErr(null)
            void meal
              .createOutput({
                projectId,
                title,
                description: '',
                status,
                location: location || null,
                targetPeriod: '2026-Q1',
              })
              .then(() => {
                setTitle('')
                setLocation('')
                setOpen(false)
              })
              .catch((e: unknown) => setErr(e instanceof Error ? e.message : 'Failed to create output'))
              .finally(() => setSaving(false))
          }}
        >
          <label className="text-sm sm:col-span-2">
            Title
            <input className={fieldClass()} value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label className="text-sm">
            Location <span className="text-[var(--sea-ink-soft)]">(optional)</span>
            <input className={fieldClass()} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. North, East, Site A" />
          </label>
          <label className="text-sm">
            Status
            <select className={fieldClass()} value={status} onChange={(e) => setStatus(e.target.value as OutputStatus)}>
              {outputStatuses.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? 'Saving…' : 'Create output'}
            </Button>
          </div>
          {err && <p className="sm:col-span-2 text-sm text-red-600 dark:text-red-400">{err}</p>}
        </form>
      )}
    </div>
  )
}

export function NewIndicatorForm({ projectId }: { projectId: string | null }) {
  const meal = useWorkspaceMeal()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<IndicatorType>('count')
  const [location, setLocation] = useState('')
  const [unit, setUnit] = useState('')
  const [baseline, setBaseline] = useState('0')
  const [target, setTarget] = useState('100')
  const [current, setCurrent] = useState('0')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useMutationError()

  if (!meal.canEdit || !projectId) return null

  return (
    <div>
      <Button type="button" size="sm" onClick={() => setOpen((v) => !v)}>
        {open ? 'Cancel' : 'New indicator'}
      </Button>
      {open && (
        <form
          className="mt-3 grid gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim()) return
            setSaving(true)
            setErr(null)
            void meal
              .createIndicator({
                projectId,
                name,
                type,
                location: location || null,
                unit: unit || null,
                baseline: Number(baseline),
                target: Number(target),
                current: Number(current),
                period: '2026-Q1',
                sourceQueryId: null,
                formula: {},
                disaggregations: [],
              })
              .then(() => {
                setName('')
                setLocation('')
                setOpen(false)
              })
              .catch((e: unknown) => setErr(e instanceof Error ? e.message : 'Failed to create indicator'))
              .finally(() => setSaving(false))
          }}
        >
          <label className="text-sm sm:col-span-2">
            Name
            <input className={fieldClass()} value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="text-sm">
            Type
            <select className={fieldClass()} value={type} onChange={(e) => setType(e.target.value as IndicatorType)}>
              {INDICATOR_TYPES.map((t) => (
                <option key={t} value={t}>
                  {INDICATOR_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Location <span className="text-[var(--sea-ink-soft)]">(optional)</span>
            <input className={fieldClass()} value={location} onChange={(e) => setLocation(e.target.value)} />
          </label>
          <label className="text-sm">
            Unit <span className="text-[var(--sea-ink-soft)]">(optional)</span>
            <input className={fieldClass()} value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. % households" />
          </label>
          <label className="text-sm">
            Baseline
            <input className={fieldClass()} type="number" value={baseline} onChange={(e) => setBaseline(e.target.value)} />
          </label>
          <label className="text-sm">
            Target
            <input className={fieldClass()} type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
          </label>
          <label className="text-sm">
            Current
            <input className={fieldClass()} type="number" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? 'Saving…' : 'Create indicator'}
            </Button>
          </div>
          {err && <p className="sm:col-span-2 text-sm text-red-600 dark:text-red-400">{err}</p>}
        </form>
      )}
    </div>
  )
}

export function IndicatorEditorActions({
  indicatorId,
  sourceQueryId,
  queries,
  onSourceQueryChange,
}: {
  indicatorId: string
  sourceQueryId?: string | null
  queries: { id: string; name: string }[]
  onSourceQueryChange: (queryId: string | null) => void
}) {
  const meal = useWorkspaceMeal()
  const [computing, setComputing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [computeErr, setComputeErr] = useState<string | null>(null)

  if (!meal.canEdit) return null

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-3">
      <label className="flex min-w-[180px] flex-1 items-center gap-2 text-xs text-[var(--sea-ink-soft)]">
        Source query
        <select
          className="h-8 flex-1 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm text-[var(--sea-ink)]"
          value={sourceQueryId ?? ''}
          onChange={(e) => onSourceQueryChange(e.target.value || null)}
        >
          <option value="">Manual current</option>
          {queries.map((q) => (
            <option key={q.id} value={q.id}>
              {q.name}
            </option>
          ))}
        </select>
      </label>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={!sourceQueryId || computing}
        onClick={() => {
          setComputing(true)
          setComputeErr(null)
          void meal
            .computeIndicatorCurrent(indicatorId)
            .catch((e: unknown) => setComputeErr(e instanceof Error ? e.message : 'Compute failed'))
            .finally(() => setComputing(false))
        }}
      >
        {computing ? 'Computing…' : 'Compute current'}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={deleting}
        onClick={() => {
          if (!confirm('Delete this indicator?')) return
          setDeleting(true)
          void meal.deleteIndicator(indicatorId).finally(() => setDeleting(false))
        }}
      >
        Delete
      </Button>
      {computeErr && <p className="w-full text-sm text-red-600 dark:text-red-400">{computeErr}</p>}
    </div>
  )
}

export function OutputEditorActions({ outputId }: { outputId: string }) {
  const meal = useWorkspaceMeal()
  const [deleting, setDeleting] = useState(false)

  if (!meal.canEdit) return null

  return (
    <div className="mt-2 flex justify-end">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={deleting}
        onClick={() => {
          if (!confirm('Delete this output?')) return
          setDeleting(true)
          void meal.deleteOutput(outputId).finally(() => setDeleting(false))
        }}
      >
        Delete
      </Button>
    </div>
  )
}

/** Inline edit form for a project's editable fields. */
export function ProjectEditForm({ project }: { project: Project }) {
  const meal = useWorkspaceMeal()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(project.name)
  const [code, setCode] = useState(project.code ?? '')
  const [program, setProgram] = useState(project.program ?? '')
  const [description, setDescription] = useState(project.description)
  const [status, setStatus] = useState<ProjectStatus>(project.status ?? 'in_progress')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useMutationError()

  if (!meal.canEdit) return null

  if (!open) {
    return (
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(true)}>
        Edit
      </Button>
    )
  }

  return (
    <form
      className="mt-3 grid gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault()
        setSaving(true)
        setErr(null)
        void meal
          .updateProject(project.id, { name, code, program, description, status })
          .then(() => setOpen(false))
          .catch((e: unknown) => setErr(e instanceof Error ? e.message : 'Failed to update project'))
          .finally(() => setSaving(false))
      }}
    >
      <label className="text-sm sm:col-span-2">
        Name
        <input className={fieldClass()} value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label className="text-sm">
        Code
        <input className={fieldClass()} value={code} onChange={(e) => setCode(e.target.value)} />
      </label>
      <label className="text-sm">
        Program
        <input className={fieldClass()} value={program} onChange={(e) => setProgram(e.target.value)} />
      </label>
      <label className="text-sm sm:col-span-2">
        Description
        <input className={fieldClass()} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <label className="text-sm">
        Status
        <select className={fieldClass()} value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
          {projectStatuses.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-center gap-2 sm:col-span-2">
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        {err && <p className="text-sm text-red-600 dark:text-red-400">{err}</p>}
      </div>
    </form>
  )
}

/** Inline edit form for an output's editable fields. */
export function OutputEditForm({ output }: { output: Output }) {
  const meal = useWorkspaceMeal()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(output.title)
  const [description, setDescription] = useState(output.description)
  const [status, setStatus] = useState<OutputStatus>(output.status)
  const [location, setLocation] = useState(output.location ?? '')
  const [targetPeriod, setTargetPeriod] = useState(output.targetPeriod ?? '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useMutationError()

  if (!meal.canEdit) return null

  if (!open) {
    return (
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(true)}>
        Edit
      </Button>
    )
  }

  return (
    <form
      className="mt-3 grid gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault()
        setSaving(true)
        setErr(null)
        void meal
          .updateOutput(output.id, {
            title,
            description,
            status,
            location: location || null,
            targetPeriod: targetPeriod || null,
          })
          .then(() => setOpen(false))
          .catch((e: unknown) => setErr(e instanceof Error ? e.message : 'Failed to update output'))
          .finally(() => setSaving(false))
      }}
    >
      <label className="text-sm sm:col-span-2">
        Title
        <input className={fieldClass()} value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label className="text-sm sm:col-span-2">
        Description
        <input className={fieldClass()} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <label className="text-sm">
        Location <span className="text-[var(--sea-ink-soft)]">(optional)</span>
        <input className={fieldClass()} value={location} onChange={(e) => setLocation(e.target.value)} />
      </label>
      <label className="text-sm">
        Target period
        <input className={fieldClass()} value={targetPeriod} onChange={(e) => setTargetPeriod(e.target.value)} />
      </label>
      <label className="text-sm">
        Status
        <select className={fieldClass()} value={status} onChange={(e) => setStatus(e.target.value as OutputStatus)}>
          {outputStatuses.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-center gap-2 sm:col-span-2">
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        {err && <p className="text-sm text-red-600 dark:text-red-400">{err}</p>}
      </div>
    </form>
  )
}

/** Inline edit form for an indicator's editable fields (excludes sourceQueryId — handled by IndicatorEditorActions). */
export function IndicatorEditForm({ indicator }: { indicator: Indicator }) {
  const meal = useWorkspaceMeal()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(indicator.name)
  const [type, setType] = useState<IndicatorType>(indicator.type)
  const [location, setLocation] = useState(indicator.location ?? '')
  const [unit, setUnit] = useState(indicator.unit ?? '')
  const [baseline, setBaseline] = useState(String(indicator.baseline ?? 0))
  const [target, setTarget] = useState(String(indicator.target ?? 0))
  const [current, setCurrent] = useState(String(indicator.current ?? 0))
  const [period, setPeriod] = useState(indicator.period ?? '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useMutationError()

  if (!meal.canEdit) return null

  if (!open) {
    return (
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(true)}>
        Edit
      </Button>
    )
  }

  return (
    <form
      className="mt-3 grid gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault()
        setSaving(true)
        setErr(null)
        void meal
          .updateIndicator(indicator.id, {
            name,
            type,
            location: location || null,
            unit: unit || null,
            baseline: Number(baseline),
            target: Number(target),
            current: Number(current),
            period: period || null,
          })
          .then(() => setOpen(false))
          .catch((e: unknown) => setErr(e instanceof Error ? e.message : 'Failed to update indicator'))
          .finally(() => setSaving(false))
      }}
    >
      <label className="text-sm sm:col-span-2">
        Name
        <input className={fieldClass()} value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label className="text-sm">
        Type
        <select className={fieldClass()} value={type} onChange={(e) => setType(e.target.value as IndicatorType)}>
          {INDICATOR_TYPES.map((t) => (
            <option key={t} value={t}>
              {INDICATOR_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        Location <span className="text-[var(--sea-ink-soft)]">(optional)</span>
        <input className={fieldClass()} value={location} onChange={(e) => setLocation(e.target.value)} />
      </label>
      <label className="text-sm">
        Unit <span className="text-[var(--sea-ink-soft)]">(optional)</span>
        <input className={fieldClass()} value={unit} onChange={(e) => setUnit(e.target.value)} />
      </label>
      <label className="text-sm">
        Baseline
        <input className={fieldClass()} type="number" value={baseline} onChange={(e) => setBaseline(e.target.value)} />
      </label>
      <label className="text-sm">
        Target
        <input className={fieldClass()} type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
      </label>
      <label className="text-sm">
        Current
        <input className={fieldClass()} type="number" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </label>
      <label className="text-sm">
        Period
        <input className={fieldClass()} value={period} onChange={(e) => setPeriod(e.target.value)} />
      </label>
      <div className="flex items-center gap-2 sm:col-span-2">
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        {err && <p className="text-sm text-red-600 dark:text-red-400">{err}</p>}
      </div>
    </form>
  )
}

/** Manage output↔indicator links for a single indicator: list, add, remove. */
export function IndicatorLinkManager({
  indicatorId,
  linkedOutputs,
  outputs,
}: {
  indicatorId: string
  linkedOutputs: Output[]
  outputs: Output[]
}) {
  const meal = useWorkspaceMeal()
  const [adding, setAdding] = useState(false)
  const [outputId, setOutputId] = useState('')
  const [weight, setWeight] = useState('1')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useMutationError()

  if (!meal.canEdit) return null

  const linkedIds = new Set(linkedOutputs.map((o) => o.id))
  const available = outputs.filter((o) => !linkedIds.has(o.id))

  return (
    <div className="mt-3 border-t border-[var(--line)] pt-3">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">Linked outputs</h4>
        <Button type="button" size="sm" variant="ghost" onClick={() => setAdding((v) => !v)}>
          {adding ? 'Cancel' : 'Link output'}
        </Button>
      </div>

      {adding && (
        <form
          className="mb-2 flex flex-wrap items-end gap-2 rounded-md border border-[var(--line)] bg-[var(--surface)] p-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!outputId) return
            setSaving(true)
            setErr(null)
            void meal
              .upsertLink({
                outputId,
                indicatorId,
                weight: Number(weight) || 1,
                note: null,
              })
              .then(() => {
                setOutputId('')
                setWeight('1')
                setAdding(false)
              })
              .catch((e: unknown) => setErr(e instanceof Error ? e.message : 'Failed to link output'))
              .finally(() => setSaving(false))
          }}
        >
          <label className="min-w-[180px] flex-1 text-xs">
            Output
            <select className={fieldClass()} value={outputId} onChange={(e) => setOutputId(e.target.value)} required>
              <option value="">Select output…</option>
              {available.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                </option>
              ))}
            </select>
          </label>
          <label className="w-24 text-xs">
            Weight
            <input className={fieldClass()} type="number" step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </label>
          <Button type="submit" size="sm" disabled={saving || !outputId}>
            {saving ? 'Linking…' : 'Link'}
          </Button>
          {err && <p className="w-full text-sm text-red-600 dark:text-red-400">{err}</p>}
        </form>
      )}

      {linkedOutputs.length === 0 && !adding ? (
        <p className="text-sm text-[var(--sea-ink-soft)]">No linked outputs.</p>
      ) : (
        <ul className="space-y-2">
          {linkedOutputs.map((o) => (
            <li
              key={o.id}
              className="flex items-center justify-between rounded-md border border-[var(--line)] bg-[var(--bg-base)]/40 px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <div className="font-medium text-[var(--sea-ink)]">{o.title}</div>
                <div className="text-xs text-[var(--sea-ink-soft)]">{o.status.replace('_', ' ')}</div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (!confirm('Unlink this output?')) return
                  void meal.deleteLink(o.id, indicatorId)
                }}
              >
                Unlink
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
