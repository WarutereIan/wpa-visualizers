export type DashboardStatus = 'draft' | 'published' | 'archived'

export function canPublish(s: DashboardStatus): boolean {
  return s === 'draft'
}

export function canUnpublish(s: DashboardStatus): boolean {
  return s === 'published'
}

export function canArchive(s: DashboardStatus): boolean {
  return s === 'draft' || s === 'published'
}

export const AUTO_REFRESH_INTERVALS = [60, 300, 600, 1800, 3600] as const

export function nextAutoRefreshLabel(seconds: number | null): string {
  if (seconds == null) return 'Off'
  if (seconds >= 3600 && seconds % 3600 === 0) {
    const hours = seconds / 3600
    return hours === 1 ? '1 hour' : `${hours} hours`
  }
  const minutes = seconds / 60
  if (minutes === 1) return '1 minute'
  if (Number.isInteger(minutes)) return `${minutes} minutes`
  return `${seconds} seconds`
}
