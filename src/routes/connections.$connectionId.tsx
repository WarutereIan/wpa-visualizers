import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { ProjectMoveSelect } from '#/components/layout/ProjectScopeSelect'
import { useConnections, useTriggerIngest, useUpdateConnection } from '#/lib/api/connections'
import { useImportJobs } from '#/lib/api/importJobs'
import { useOrgId, useWorkspaceReady } from '#/lib/api/workspace'

export const Route = createFileRoute('/connections/$connectionId')({
  component: ConnectionDetailPage,
})

function ConnectionDetailPage() {
  const { connectionId } = Route.useParams()
  const workspaceReady = useWorkspaceReady()
  const orgId = useOrgId()
  const { data: connections = [], isLoading } = useConnections(workspaceReady ? orgId : null)
  const { data: jobs = [] } = useImportJobs(workspaceReady ? orgId : null, connectionId)
  const triggerIngest = useTriggerIngest(workspaceReady ? orgId : null)
  const updateConnection = useUpdateConnection(workspaceReady ? orgId : null)

  const connection = connections.find((c) => c.id === connectionId)

  if (!workspaceReady) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 text-sm">
        Sign in to view connection details.
      </div>
    )
  }

  if (isLoading) {
    return <p className="text-sm text-[var(--sea-ink-soft)]">Loading…</p>
  }

  if (!connection) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--sea-ink-soft)]">Connection not found.</p>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link to="/connections">Back to connections</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button type="button" variant="ghost" size="sm" asChild className="mb-2 -ml-2">
            <Link to="/connections">← Connections</Link>
          </Button>
          <h1 className="text-2xl font-bold text-[var(--sea-ink)]">{connection.name}</h1>
          <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
            {connection.sourceType} · {connection.syncSchedule}
          </p>
          {connection.endpointUrl ? (
            <p className="mt-1 break-all font-mono text-xs text-[var(--sea-ink-soft)]">
              {connection.endpointUrl}
            </p>
          ) : null}
          <div className="mt-3">
            <p className="mb-1 text-xs font-medium text-[var(--sea-ink-soft)]">Move to project</p>
            <ProjectMoveSelect
              value={connection.projectId}
              onChange={(projectId) =>
                void updateConnection.mutateAsync({ id: connection.id, patch: { projectId } })
              }
              disabled={updateConnection.isPending}
            />
          </div>
        </div>
        <Button
          type="button"
          disabled={triggerIngest.isPending}
          onClick={() => void triggerIngest.mutateAsync({ connectionId })}
        >
          {triggerIngest.isPending ? 'Syncing…' : 'Sync now'}
        </Button>
      </div>

      <section className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-4">
        <h2 className="text-sm font-semibold text-[var(--sea-ink)]">Sync history</h2>
        {jobs.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--sea-ink-soft)]">No import jobs yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {jobs.map((job) => (
              <li
                key={job.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--line)] px-3 py-2 text-sm"
              >
                <span>
                  {new Date(job.createdAt).toLocaleString()} · {job.status} ·{' '}
                  {job.rowCount.toLocaleString()} rows
                </span>
                {job.resultTableId ? (
                  <Link
                    to="/data-management"
                    className="text-[var(--lagoon-deep)] hover:underline"
                  >
                    View in query builder
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
