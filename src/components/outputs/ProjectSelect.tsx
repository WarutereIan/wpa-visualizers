import { useOutputsIndicatorsStore } from '#/stores/outputsIndicatorsStore'

export function ProjectSelect() {
  const projects = useOutputsIndicatorsStore((s) => s.projects)
  const selectedProjectId = useOutputsIndicatorsStore((s) => s.selectedProjectId)
  const setSelected = useOutputsIndicatorsStore((s) => s.setSelectedProjectId)

  return (
    <label className="flex flex-col gap-1.5 text-sm sm:flex-row sm:items-center sm:gap-3">
      <span className="shrink-0 font-medium text-[var(--sea-ink)]">Project</span>
      <select
        className="min-w-[min(100%,280px)] rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-[var(--sea-ink)] outline-none focus:ring-2 focus:ring-[var(--lagoon)]"
        value={selectedProjectId ?? ''}
        onChange={(e) => setSelected(e.target.value || null)}
      >
        <option value="">All projects</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.code} — {p.name}
          </option>
        ))}
      </select>
    </label>
  )
}
