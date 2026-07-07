import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '#/components/ui/button'
import { useCreateExportJob, useCreateReport, useExportJobs, useReports } from '#/lib/api/exports'
import { useOrgId, useWorkspaceReady } from '#/lib/api/workspace'

export const Route = createFileRoute('/reports')({
  component: ReportsPage,
})

function ReportsPage() {
  const workspaceReady = useWorkspaceReady()
  const orgId = useOrgId()
  const {
    data: reports = [],
    isLoading: reportsLoading,
    isError: reportsError,
  } = useReports(workspaceReady ? orgId : null)
  const { data: jobs = [] } = useExportJobs(workspaceReady ? orgId : null)
  const createReport = useCreateReport(workspaceReady ? orgId : null)
  const createExport = useCreateExportJob(workspaceReady ? orgId : null)
  const [name, setName] = useState('')
  const [formMsg, setFormMsg] = useState<string | null>(null)

  if (!workspaceReady) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 text-sm text-[var(--sea-ink-soft)]">
        Sign in to create narrative reports and queue exports.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-[var(--sea-ink)]">Reports & exports</h1>
        <p className="mt-2 text-sm text-[var(--sea-ink-soft)]">
          Narrative reports (story mode) and async PDF/PPTX export jobs. The export worker processes
          queued jobs when running.
        </p>
      </header>

      <section className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4">
        <h2 className="mb-3 text-base font-semibold text-[var(--sea-ink)]">New report</h2>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim()) return
            void createReport
              .mutateAsync({ name })
              .then(() => {
                setName('')
                setFormMsg('Report draft created.')
              })
              .catch((err: unknown) =>
                setFormMsg(err instanceof Error ? err.message : 'Failed to create report'),
              )
          }}
        >
          <label className="min-w-[200px] flex-1 text-sm">
            Report name
            <input
              className="mt-1 flex h-9 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <Button type="submit" size="sm" disabled={createReport.isPending}>
            Create draft
          </Button>
        </form>
        {formMsg && (
          <p className="mt-2 text-xs text-[var(--sea-ink-soft)]">{formMsg}</p>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4">
          <h2 className="mb-3 text-base font-semibold text-[var(--sea-ink)]">Reports</h2>
          {reportsLoading ? (
            <p className="text-sm text-[var(--sea-ink-soft)]">Loading reports…</p>
          ) : reportsError ? (
            <p className="text-sm text-red-600">Failed to load reports.</p>
          ) : reports.length === 0 ? (
            <p className="text-sm text-[var(--sea-ink-soft)]">No reports yet.</p>
          ) : (
            <ul className="space-y-2">
              {reports.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-md border border-[var(--line)] px-3 py-2 text-sm"
                >
                  <span>
                    {r.name} · <span className="text-[var(--sea-ink-soft)]">{r.status}</span>
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={createExport.isPending}
                    onClick={() =>
                      void createExport.mutateAsync({
                        targetType: 'report',
                        targetId: r.id,
                        format: 'pdf',
                      })
                    }
                  >
                    Export PDF
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4">
          <h2 className="mb-3 text-base font-semibold text-[var(--sea-ink)]">Export jobs</h2>
          {jobs.length === 0 ? (
            <p className="text-sm text-[var(--sea-ink-soft)]">No export jobs yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {jobs.map((j) => (
                <li key={j.id} className="rounded-md border border-[var(--line)] px-3 py-2">
                  <div className="font-medium text-[var(--sea-ink)]">
                    {j.format.toUpperCase()} · {j.targetType} · {j.status}
                  </div>
                  <div className="text-xs text-[var(--sea-ink-soft)]">
                    {new Date(j.createdAt).toLocaleString()}
                    {j.error ? ` · ${j.error}` : ''}
                  </div>
                  {j.status === 'success' && j.resultUrl && (
                    <a
                      href={j.resultUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-xs font-medium text-[var(--lagoon-deep)] hover:underline"
                    >
                      Download
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
