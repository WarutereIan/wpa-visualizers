export const PLAN_ROW_LIMITS: Record<string, number> = {
  free: 10_000,
  starter: 100_000,
  professional: 1_000_000,
  enterprise: 50_000_000,
}

export function currentMonthKey(): string {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export function planLimitFor(plan: string | null | undefined): number {
  return PLAN_ROW_LIMITS[plan ?? 'free'] ?? PLAN_ROW_LIMITS.free
}
