import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/outputs-and-indicators')({
  component: OutputsAndIndicatorsLayout,
})

function OutputsAndIndicatorsLayout() {
  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 shadow-sm">
        <h1 className="text-lg font-semibold tracking-tight text-[var(--sea-ink)]">
          Outputs and indicators
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--sea-ink-soft)]">
          Track programme outputs and M&amp;E indicators by project. 
        </p>
      </header>
      <Outlet />
    </div>
  )
}
