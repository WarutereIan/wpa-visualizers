import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { useWorkspaceDashboards } from '#/hooks/useWorkspaceDashboards'

export const Route = createFileRoute('/dashboards/add')({
  component: DashboardAddPage,
})

function DashboardAddPage() {
  const navigate = useNavigate()
  const { addDashboard } = useWorkspaceDashboards()
  const [name, setName] = useState('')
  const [open, setOpen] = useState(true)

  const goBack = () => {
    setOpen(false)
    void navigate({ to: '/dashboards' })
  }

  const create = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const dashboard = addDashboard(trimmed)
    void navigate({
      to: '/dashboards/$dashboardId',
      params: { dashboardId: dashboard.id },
      search: { edit: true },
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) goBack()
      }}
    >
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>New Dashboard</DialogTitle>
        </DialogHeader>
        <label className="block text-sm font-medium text-[var(--sea-ink)]">
          Name
          <input
            className="mt-1 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)]"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') create()
            }}
            placeholder="Dashboard name"
            aria-label="Dashboard name"
            autoFocus
          />
        </label>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={goBack}>
            Cancel
          </Button>
          <Button type="button" onClick={create} disabled={!name.trim()}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
