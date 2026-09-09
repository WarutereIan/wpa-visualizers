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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { useWorkspaceDashboards } from '#/hooks/useWorkspaceDashboards'
import { useSelectedProject } from '#/hooks/useSelectedProject'

export const Route = createFileRoute('/dashboards/add')({
  component: DashboardAddPage,
})

function DashboardAddPage() {
  const navigate = useNavigate()
  const { addDashboard, templates, createFromTemplate } = useWorkspaceDashboards()
  const { selectedProjectId } = useSelectedProject()
  const [name, setName] = useState('')
  const [templateId, setTemplateId] = useState<string>('blank')
  const [open, setOpen] = useState(true)
  const [creating, setCreating] = useState(false)

  const goBack = () => {
    setOpen(false)
    void navigate({ to: '/dashboards' })
  }

  const create = async () => {
    const trimmed = name.trim()
    if (!trimmed || creating) return
    setCreating(true)
    try {
      if (templateId !== 'blank') {
        const dashboard = await createFromTemplate(templateId, trimmed, selectedProjectId)
        if (!dashboard) return
        void navigate({
          to: '/dashboards/$dashboardId',
          params: { dashboardId: dashboard.id },
          search: { edit: true },
        })
        return
      }
      const dashboard = addDashboard(trimmed, undefined, selectedProjectId)
      void navigate({
        to: '/dashboards/$dashboardId',
        params: { dashboardId: dashboard.id },
        search: { edit: true },
      })
    } finally {
      setCreating(false)
    }
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
        <div className="space-y-3">
          <label className="block text-sm font-medium text-[var(--sea-ink)]">
            Name
            <input
              className="mt-1 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)]"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void create()
              }}
              placeholder="Dashboard name"
              aria-label="Dashboard name"
              autoFocus
            />
          </label>
          <div>
            <label className="text-sm font-medium text-[var(--sea-ink)]" htmlFor="dashboard-template">
              Start from
            </label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger id="dashboard-template" className="mt-1" aria-label="Dashboard template">
                <SelectValue placeholder="Blank dashboard" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blank">Blank dashboard</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name.replace(/^Template:\s*/i, '')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {templates.length === 0 ? (
              <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
                Tip: open a dashboard and use More → Save as template.
              </p>
            ) : null}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={goBack} disabled={creating}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void create()} disabled={!name.trim() || creating}>
            {creating ? 'Creating…' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
