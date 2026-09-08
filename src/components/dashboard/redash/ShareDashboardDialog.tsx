/**
 * Token flow (create-shared-link / shared-link-access — do not invent a parallel mechanism):
 *
 * 1. Owner/admin invokes `create-shared-link` with { organizationId, dashboardId }.
 *    The edge function (service role, after assertOrgRole owner|admin) inserts
 *    public.shared_links { token, dashboard_id, password_hash?, expires_at? } and
 *    returns { id, token, expires_at, embed_allowed }.
 * 2. Secret address is `/shared/<token>`. No session. The public route POSTs to
 *    `shared-link-access` via invokePublicEdgeFunction (anon key only).
 * 3. `shared-link-access` looks up the token with the service role, rejects missing /
 *    expired / revoked / bad-password links, then returns the dashboard. For Redash-model
 *    dashboards it also returns dashboard_widgets + visualizations + query_definitions
 *    and executes each distinct query through the shared run-query engine
 *    (`executeQueryForOrg`) so the page can render viz-lib from pre-fetched rows.
 * 4. Revoke: UPDATE shared_links SET revoked = true (RLS: owner/admin). Access then
 *    returns 410. Turning the toggle back on inserts a NEW token so the old URL stays dead.
 */
import { useEffect, useState } from 'react'
import { Copy } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import {
  useCreateSharedLink,
  useDashboardSharedLink,
  useRevokeDashboardSharedLink,
} from '#/lib/api/sharedLinks'
import { useOrgId } from '#/lib/api/workspace'

export type ShareDashboardDialogProps = {
  open: boolean
  dashboardId: string
  onClose: () => void
}

export function ShareDashboardDialog({ open, dashboardId, onClose }: ShareDashboardDialogProps) {
  const orgId = useOrgId()
  const { data: existing, isLoading } = useDashboardSharedLink(open ? orgId : null, open ? dashboardId : null)
  const createLink = useCreateSharedLink(orgId)
  const revokeLink = useRevokeDashboardSharedLink(orgId)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localToken, setLocalToken] = useState<string | null>(null)

  const token = localToken ?? existing?.token ?? null
  const enabled = Boolean(token)
  const shareUrl = token ? `${window.location.origin}/shared/${token}` : ''
  const busy = createLink.isPending || revokeLink.isPending

  useEffect(() => {
    if (!open) {
      setCopied(false)
      setError(null)
      setLocalToken(null)
      return
    }
    if (existing?.token) setLocalToken(existing.token)
  }, [open, existing?.token])

  const setPublicAccess = async (next: boolean) => {
    setError(null)
    try {
      if (next) {
        if (token) return
        const created = await createLink.mutateAsync({ dashboardId })
        setLocalToken(created.token)
      } else {
        await revokeLink.mutateAsync(dashboardId)
        setLocalToken(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update sharing')
    }
  }

  const copyUrl = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy to clipboard')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>Share Dashboard</DialogTitle>
          <DialogDescription>
            Anyone with the secret address can view this dashboard without signing in.
          </DialogDescription>
        </DialogHeader>

        <label className="flex cursor-pointer items-center gap-3 text-sm text-[var(--sea-ink)]">
          <input
            type="checkbox"
            className="size-4 accent-[#2196f3]"
            checked={enabled}
            disabled={busy || isLoading || !orgId}
            onChange={(event) => void setPublicAccess(event.target.checked)}
          />
          Allow public access
        </label>

        {enabled ? (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--sea-ink)]" htmlFor="secret-address">
              Secret address
            </label>
            <div className="flex gap-2">
              <input
                id="secret-address"
                readOnly
                value={shareUrl}
                className="h-9 min-w-0 flex-1 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-sm text-[var(--sea-ink)]"
              />
              <Button type="button" variant="outline" size="sm" onClick={() => void copyUrl()}>
                <Copy className="size-3.5" />
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
        ) : null}

        {error ? <p className="text-xs text-red-700">{error}</p> : null}
      </DialogContent>
    </Dialog>
  )
}
