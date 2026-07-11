import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { FolderKanban, Plus } from 'lucide-react'
import { useWorkspaceMeal } from '#/hooks/useWorkspaceMeal'
import { Button } from '#/components/ui/button'
import type { ProjectStatus } from '#/types/outputsIndicators'

export const Route = createFileRoute('/projects/')({
  component: ProjectsListPage,
})

const statusLabel: Record<ProjectStatus, string> = {
  planned: 'Planned',
  in_progress: 'In progress',
  completed: 'Completed',
  at_risk: 'At risk',
}

const statusClass: Record<ProjectStatus, string> = {
  planned: 'bg-[var(--sea-ink-soft)]/15 text-[var(--sea-ink)]',
  in_progress: 'bg-[rgba(79,184,178,0.2)] text-[var(--lagoon-deep)]',
  completed: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
  at_risk: 'bg-amber-500/15 text-amber-900 dark:text-amber-200',
}

function fieldClass() {
  return 'mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm'
}

function ProjectsListPage() {
  const meal = useWorkspaceMeal()
  const { projects, outputs, indicators, loading, createProject, deleteProject, canEdit } = meal
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [program, setProgram] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('in_progress')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 text-sm text-[var(--sea-ink-soft)]">
        Loading MEAL projects…
      </div>
    )
  }

  const counts = (projectId: string) => {
    const outCount = outputs.filter((o) => o.projectId === projectId).length
    const indCount = indicators.filter((i) => i.projectId === projectId).length
    return { outCount, indCount }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setErr(null)
    void createProject({ name, code, program, description, status })
      .then(() => {
        setName('')
        setCode('')
        setProgram('')
        setDescription('')
        setOpen(false)
      })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : 'Failed to create project'))
      .finally(() => setSaving(false))
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--sea-ink)]">
            <FolderKanban size={24} /> Projects
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-[var(--sea-ink-soft)]">
            MEAL projects — interventions with a results chain of outputs and indicators. Open a project to
            manage its outputs, indicators, and output↔indicator links.
          </p>
        </div>
        {canEdit && (
          <Button type="button" size="sm" onClick={() => setOpen((v) => !v)}>
            {open ? 'Cancel' : (
              <>
                <Plus size={16} className="mr-1" /> New project
              </>
            )}
          </Button>
        )}
      </header>

      {open && canEdit && (
        <form
          className="grid gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:grid-cols-2"
          onSubmit={submit}
        >
          <label className="text-sm sm:col-span-2">
            Name
            <input className={fieldClass()} value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="text-sm">
            Code
            <input className={fieldClass()} value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. MEALS-01" />
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
              {(['planned', 'in_progress', 'completed', 'at_risk'] as ProjectStatus[]).map((s) => (
                <option key={s} value={s}>
                  {statusLabel[s]}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center sm:col-span-2">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? 'Saving…' : 'Create project'}
            </Button>
            {err && <p className="ml-3 text-sm text-red-600 dark:text-red-400">{err}</p>}
          </div>
        </form>
      )}

      {projects.length === 0 ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-8 text-center text-sm text-[var(--sea-ink-soft)]">
          No projects yet. {canEdit && 'Use “New project” to add one.'}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => {
            const { outCount, indCount } = counts(p.id)
            return (
              <article
                key={p.id}
                className="flex flex-col rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[var(--sea-ink)]">{p.name}</h3>
                    <p className="mt-0.5 font-mono text-xs text-[var(--sea-ink-soft)]">
                      {p.code ?? '—'}
                      {p.program ? ` · ${p.program}` : ''}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${statusClass[p.status]}`}>
                    {statusLabel[p.status]}
                  </span>
                </div>
                {p.description && (
                  <p className="mt-2 line-clamp-3 text-sm text-[var(--sea-ink-soft)]">{p.description}</p>
                )}
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-[var(--bg-base)]/80 px-3 py-2">
                    <dt className="text-xs text-[var(--sea-ink-soft)]">Outputs</dt>
                    <dd className="font-semibold text-[var(--sea-ink)]">{outCount}</dd>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-base)]/80 px-3 py-2">
                    <dt className="text-xs text-[var(--sea-ink-soft)]">Indicators</dt>
                    <dd className="font-semibold text-[var(--sea-ink)]">{indCount}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex items-center justify-between">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/projects/$projectId" params={{ projectId: p.id }}>
                      Open
                    </Link>
                  </Button>
                  {canEdit && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={!canEdit}
                      onClick={() => {
                        if (!confirm(`Delete project “${p.name}”? This also removes its outputs and links.`)) return
                        void deleteProject(p.id).then(() => navigate({ to: '/projects' }))
                      }}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
