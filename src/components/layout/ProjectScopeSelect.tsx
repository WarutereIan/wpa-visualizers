import { useWorkspaceMeal } from '#/hooks/useWorkspaceMeal'
import { useSelectedProject } from '#/hooks/useSelectedProject'
import {
  projectIdToSelectValue,
  projectOptions,
  selectValueToProjectId,
} from '#/lib/projectScope'
import { cn } from '#/lib/utils'

const selectClassName =
  'rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--sea-ink)] outline-none focus:ring-2 focus:ring-[var(--lagoon)]'

function ProjectOptionsList({ projects }: { projects: { id: string; name: string; code?: string | null }[] }) {
  return (
    <>
      {projectOptions(projects).map((option) => (
        <option key={option.id ?? 'org'} value={projectIdToSelectValue(option.id)}>
          {option.label}
        </option>
      ))}
    </>
  )
}

export function ProjectScopeSelect({ className }: { className?: string } = {}) {
  const meal = useWorkspaceMeal()
  const { selectedProjectId, setSelectedProjectId } = useSelectedProject(
    meal.loading ? undefined : meal.projects,
  )

  return (
    <label className={cn('flex min-w-0 shrink-0 items-center gap-2', className)}>
      <span className="sr-only">Project scope</span>
      <select
        aria-label="Project scope"
        className={cn(selectClassName, 'max-w-[min(100%,240px)] truncate')}
        value={projectIdToSelectValue(selectedProjectId)}
        onChange={(event) => setSelectedProjectId(selectValueToProjectId(event.target.value))}
      >
        <ProjectOptionsList projects={meal.projects} />
      </select>
    </label>
  )
}

export function ProjectMoveSelect({
  value,
  onChange,
  disabled,
  id,
  className,
  'aria-label': ariaLabel = 'Move to project',
}: {
  value: string | null
  onChange: (projectId: string | null) => void
  disabled?: boolean
  id?: string
  className?: string
  'aria-label'?: string
}) {
  const { projects } = useWorkspaceMeal()

  return (
    <select
      id={id}
      aria-label={ariaLabel}
      disabled={disabled}
      className={cn(selectClassName, 'h-8 max-w-[200px] py-1 text-xs', className)}
      value={projectIdToSelectValue(value)}
      onChange={(event) => onChange(selectValueToProjectId(event.target.value))}
      onClick={(event) => event.stopPropagation()}
    >
      <ProjectOptionsList projects={projects} />
    </select>
  )
}
