export type AlertCondition = {
  op?: 'lt' | 'lte' | 'gt' | 'gte' | 'eq'
  threshold?: number
  unit?: string
}

/** Mirrors evaluate-alerts edge function logic. */
export function evaluateAlertCondition(
  condition: AlertCondition,
  current: number,
  target: number | null,
): boolean {
  const op = condition.op ?? 'lt'
  let value = condition.threshold ?? 0
  if (condition.unit === 'percent_of_target' && target && target > 0) {
    value = (condition.threshold ?? 0) * target / 100
  }
  switch (op) {
    case 'lt':
      return current < value
    case 'lte':
      return current <= value
    case 'gt':
      return current > value
    case 'gte':
      return current >= value
    case 'eq':
      return current === value
    default:
      return false
  }
}
