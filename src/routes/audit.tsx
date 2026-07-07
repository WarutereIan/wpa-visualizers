import { createFileRoute } from '@tanstack/react-router'
import { useAuditLogs } from '#/lib/api/audit'
import { useOrgId, useWorkspaceReady } from '#/lib/api/workspace'

export const Route = createFileRoute('/audit')({
  component: AuditPage,
})

function AuditPage() {
  const workspaceReady = useWorkspaceReady()
  const orgId = useOrgId()
  const { data: logs = [], isLoading, isError } = useAuditLogs(workspaceReady ? orgId : null)

  if (!workspaceReady) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 text-sm text-[var(--sea-ink-soft)]">
        Sign in to view the audit log.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-[var(--sea-ink)]">Audit log</h1>
        <p className="mt-2 text-sm text-[var(--sea-ink-soft)]">
          Append-only trail of writes on Tier 1–3 tables (projects, dashboards, connections, etc.).
        </p>
      </header>

      {isLoading ? (
        <p className="text-sm text-[var(--sea-ink-soft)]">Loading…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">Failed to load audit log.</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-[var(--sea-ink-soft)]">No audit entries yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--surface-strong)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--line)] text-[var(--sea-ink-soft)]">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">Entity ID</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-[var(--line)] last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap text-[var(--sea-ink-soft)]">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                  <td className="px-4 py-3">{log.entityType}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--sea-ink-soft)]">
                    {log.entityId ? `${log.entityId.slice(0, 8)}` : '—'}
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
