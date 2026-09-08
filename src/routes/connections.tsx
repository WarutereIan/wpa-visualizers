import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import { Button } from '#/components/ui/button'
import { ProjectMoveSelect } from '#/components/layout/ProjectScopeSelect'
import { useConnections, useOrganizationUsage, useTriggerIngest, useUpdateConnection } from '#/lib/api/connections'
import { useOrgId, useWorkspaceReady } from '#/lib/api/workspace'
import { useSelectedProject } from '#/hooks/useSelectedProject'
import { filterByProjectScope } from '#/lib/projectScope'

export const Route = createFileRoute('/connections')({
  component: ConnectionsPage,
})

function ConnectionsPage() {
  const workspaceReady = useWorkspaceReady()
  const orgId = useOrgId()
  const { data: connections = [], isLoading } = useConnections(workspaceReady ? orgId : null)
  const { selectedProjectId } = useSelectedProject()
  const scopedConnections = useMemo(
    () => filterByProjectScope(connections, selectedProjectId),
    [connections, selectedProjectId],
  )
  const { data: usage } = useOrganizationUsage(workspaceReady ? orgId : null)
  const triggerIngest = useTriggerIngest(workspaceReady ? orgId : null)
  const updateConnection = useUpdateConnection(workspaceReady ? orgId : null)

  if (!workspaceReady) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 text-sm text-[var(--sea-ink-soft)]">
        Sign in to manage data source connections.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-[var(--sea-ink)]">Data connections</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--sea-ink-soft)]">
          Server-side connectors with credentials stored in Vault. Sync status and import history are
          tracked per connection.
        </p>
        {usage ? (
          <p className="mt-2 text-xs text-[var(--sea-ink-soft)]">
            Usage this month: {usage.rowsSynced.toLocaleString()} rows synced ({usage.month})
          </p>
        ) : null}
      </header>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" asChild>
          <Link to="/data-management/import">New import</Link>
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-[var(--sea-ink-soft)]">Loading connections…</p>
      ) : scopedConnections.length === 0 ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-8 text-center text-sm text-[var(--sea-ink-soft)]">
          No connections yet. Use Data import to create your first server-side connection.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--surface-strong)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--line)] text-[var(--sea-ink-soft)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Schedule</th>
                <th className="px-4 py-3 font-medium">Last sync</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {scopedConnections.map((c) => (
                <tr key={c.id} className="border-b border-[var(--line)] last:border-0">
                  <td className="px-4 py-3 font-medium text-[var(--sea-ink)]">
                    <Link
                      to="/connections/$connectionId"
                      params={{ connectionId: c.id }}
                      className="hover:underline"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{c.sourceType}</td>
                  <td className="px-4 py-3">{c.syncSchedule}</td>
                  <td className="px-4 py-3 text-[var(--sea-ink-soft)]">
                    {c.lastSyncAt ? new Date(c.lastSyncAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.lastSyncStatus} error={c.lastError} />
                  </td>
                  <td className="px-4 py-3">
                    <ProjectMoveSelect
                      value={c.projectId}
                      onChange={(projectId) =>
                        void updateConnection.mutateAsync({ id: c.id, patch: { projectId } })
                      }
                      disabled={updateConnection.isPending}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={triggerIngest.isPending}
                      onClick={() => void triggerIngest.mutateAsync({ connectionId: c.id })}
                    >
                      Sync now
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatusBadge({
  status,
  error,
}: {
  status: string | null
  error: string | null
}) {
  if (!status) return <span className="text-[var(--sea-ink-soft)]">—</span>
  const colors: Record<string, string> = {
    success: 'text-emerald-700 dark:text-emerald-400',
    failed: 'text-red-600 dark:text-red-400',
    running: 'text-amber-700 dark:text-amber-400',
    partial: 'text-amber-700 dark:text-amber-400',
  }
  return (
    <span className={colors[status] ?? ''} title={error ?? undefined}>
      {status}
    </span>
  )
}
