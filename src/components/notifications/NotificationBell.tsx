import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from '#/lib/api/notifications'
import { useOrgId, useWorkspaceReady } from '#/lib/api/workspace'
import { useAuthStore } from '#/stores/authStore'

export function NotificationBell() {
  const workspaceReady = useWorkspaceReady()
  const orgId = useOrgId()
  const userId = useAuthStore((s) => s.user?.id ?? null)
  const { data: unread = 0 } = useUnreadNotificationCount(workspaceReady ? orgId : null, userId ?? null)
  const { data: items = [] } = useNotifications(workspaceReady ? orgId : null, userId ?? null)
  const markRead = useMarkNotificationRead(workspaceReady ? orgId : null, userId ?? null)
  const markAllRead = useMarkAllNotificationsRead(workspaceReady ? orgId : null, userId ?? null)
  const [open, setOpen] = useState(false)

  if (!workspaceReady) return null

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="relative shrink-0"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 max-h-96 overflow-auto rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] shadow-lg">
            <div className="flex items-center justify-between border-b border-[var(--line)] px-3 py-2">
              <span className="text-sm font-semibold text-[var(--sea-ink)]">Alerts</span>
              {unread > 0 && (
                <button
                  type="button"
                  className="text-xs text-[var(--lagoon-deep)] hover:underline"
                  onClick={() => void markAllRead.mutateAsync()}
                >
                  Mark all read
                </button>
              )}
            </div>
            {items.length === 0 ? (
              <p className="px-3 py-4 text-sm text-[var(--sea-ink-soft)]">No notifications yet.</p>
            ) : (
              <ul className="divide-y divide-[var(--line)]">
                {items.map((n) => (
                  <li
                    key={n.id}
                    className={`px-3 py-2 text-sm ${n.readAt ? 'opacity-70' : 'bg-[var(--surface)]'}`}
                  >
                    <div className="font-medium text-[var(--sea-ink)]">
                      {n.payload.ruleName ?? 'Alert'}
                    </div>
                    <div className="text-[var(--sea-ink-soft)]">
                      {n.payload.indicatorName
                        ? `${n.payload.indicatorName}: ${n.payload.current ?? '—'} (${n.payload.op ?? 'lt'} ${n.payload.threshold ?? '?'})`
                        : new Date(n.createdAt).toLocaleString()}
                    </div>
                    {!n.readAt && (
                      <button
                        type="button"
                        className="mt-1 text-xs text-[var(--lagoon-deep)] hover:underline"
                        onClick={() => void markRead.mutateAsync(n.id)}
                      >
                        Mark read
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
