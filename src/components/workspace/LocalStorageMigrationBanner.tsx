import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '#/components/ui/button'
import { hasLocalWorkspaceData, migrateLocalStorageToOrg } from '#/lib/migrateLocalStorage'
import { workspaceKeys } from '#/lib/api/workspace'
import { useOrgId, useWorkspaceReady } from '#/lib/api/workspace'

export function LocalStorageMigrationBanner() {
  const workspaceReady = useWorkspaceReady()
  const orgId = useOrgId()
  const queryClient = useQueryClient()
  const [dismissed, setDismissed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (!workspaceReady || !orgId || dismissed || !hasLocalWorkspaceData()) return null

  return (
    <div className="rounded-lg border border-[var(--lagoon)]/40 bg-[rgba(79,184,178,0.1)] px-4 py-3 text-sm">
      <p className="font-medium text-[var(--sea-ink)]">Import browser demo data?</p>
      <p className="mt-1 text-[var(--sea-ink-soft)]">
        We found tables, queries, dashboards, or mappings saved locally. Import them into your
        workspace?
      </p>
      {message && <p className="mt-2 text-[var(--sea-ink)]">{message}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={busy}
          onClick={() => {
            void (async () => {
              try {
                setBusy(true)
                const result = await migrateLocalStorageToOrg(orgId)
                setMessage(
                  `Imported ${result.tables} tables, ${result.queries} queries, ${result.dashboards} dashboards, ${result.mappings} mappings.`,
                )
                await queryClient.invalidateQueries({ queryKey: workspaceKeys.all })
              } catch (err) {
                setMessage(err instanceof Error ? err.message : 'Import failed.')
              } finally {
                setBusy(false)
              }
            })()
          }}
        >
          {busy ? 'Importing…' : 'Import now'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setDismissed(true)}>
          Dismiss
        </Button>
      </div>
    </div>
  )
}
