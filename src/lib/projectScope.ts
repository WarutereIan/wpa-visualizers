export type ProjectScopeItem = {
  id: string
  name: string
  code?: string | null
}

export type ProjectOption = {
  id: string | null
  label: string
}

export function matchesProjectScope(
  itemProjectId: string | null | undefined,
  selectedProjectId: string | null,
): boolean {
  return (itemProjectId ?? null) === selectedProjectId
}

export function filterByProjectScope<T extends { projectId?: string | null }>(
  items: T[],
  selectedProjectId: string | null,
): T[] {
  return items.filter((item) => matchesProjectScope(item.projectId, selectedProjectId))
}

export function projectOptions(projects: ProjectScopeItem[]): ProjectOption[] {
  return [
    { id: null, label: 'Organization-wide' },
    ...projects.map((project) => ({
      id: project.id,
      label: project.code ? `${project.code} — ${project.name}` : project.name,
    })),
  ]
}

export function projectIdToSelectValue(id: string | null | undefined): string {
  return id ?? ''
}

export function selectValueToProjectId(value: string): string | null {
  return value === '' ? null : value
}
