import { useState } from 'react'
import { Button } from '#/components/ui/button'
import { useCreateExportJob } from '#/lib/api/exports'
import { useCreateSharedLink } from '#/lib/api/sharedLinks'
import { useCreateSnapshot } from '#/lib/api/snapshots'
import { useOrgId, useWorkspaceReady } from '#/lib/api/workspace'

export function DashboardShareToolbar({ dashboardId }: { dashboardId: string }) {
  const workspaceReady = useWorkspaceReady()
  const orgId = useOrgId()
  const createSnapshot = useCreateSnapshot(workspaceReady ? orgId : null)
  const createLink = useCreateSharedLink(workspaceReady ? orgId : null)
  const createExport = useCreateExportJob(workspaceReady ? orgId : null)
  const [period, setPeriod] = useState('2026-Q1')
  const [password, setPassword] = useState('')
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!workspaceReady) return null

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3">
      <label className="text-sm">
        Snapshot period
        <input
          className="mt-1 flex h-9 w-28 rounded-md border border-[var(--line)] bg-[var(--surface-strong)] px-2 text-sm"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        />
      </label>
      <label className="text-sm">
        Link password (optional)
        <input
          type="password"
          className="mt-1 flex h-9 w-40 rounded-md border border-[var(--line)] bg-[var(--surface-strong)] px-2 text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Optional"
        />
      </label>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy || createSnapshot.isPending}
        onClick={() => {
          setBusy(true)
          setMsg(null)
          setShareUrl(null)
          void createSnapshot
            .mutateAsync({ dashboardId, period })
            .then((snap) =>
              createLink.mutateAsync({
                snapshotId: snap.snapshotId,
                password: password.trim() || undefined,
              }),
            )
            .then((link) => {
              const url = `${window.location.origin}/shared/${link.token}`
              setShareUrl(url)
              setMsg('Snapshot created and share link generated.')
            })
            .catch((e: unknown) => setMsg(e instanceof Error ? e.message : 'Failed'))
            .finally(() => setBusy(false))
        }}
      >
        {busy ? 'Creating…' : 'Snapshot & share'}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={createExport.isPending}
        onClick={() => {
          setMsg(null)
          void createExport
            .mutateAsync({ targetType: 'dashboard', targetId: dashboardId, format: 'pdf' })
            .then(() => setMsg('PDF export queued — check Reports & exports for status.'))
            .catch((e: unknown) => setMsg(e instanceof Error ? e.message : 'Export failed'))
        }}
      >
        Export PDF
      </Button>
      {shareUrl && (
        <div className="w-full text-sm">
          <span className="text-[var(--sea-ink-soft)]">Share URL: </span>
          <code className="break-all text-[var(--sea-ink)]">{shareUrl}</code>
        </div>
      )}
      {msg && <p className={`w-full text-sm ${shareUrl ? 'text-[var(--sea-ink-soft)]' : 'text-red-600 dark:text-red-400'}`}>{msg}</p>}
    </div>
  )
}
