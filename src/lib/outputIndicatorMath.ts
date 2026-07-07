import type { OutputIndicatorLink, WpaIndicator } from '#/types/outputsIndicators'

/** Achievement toward target, 0–1 (capped). Null baseline/target/current treated as 0. */
export function indicatorProgress01(ind: WpaIndicator): number {
  const target = ind.target ?? 0
  const current = ind.current ?? 0
  if (target <= 0) return 0
  return Math.min(1, current / target)
}

export function indicatorProgressPercent(ind: WpaIndicator): number {
  return Math.round(indicatorProgress01(ind) * 1000) / 10
}

export interface ContributionPart {
  indicatorId: string
  label: string
  weight: number
  progress01: number
  progressPercent: number
  /** weight × progress01 — additive pieces of the weighted sum */
  contribution: number
}

export interface OutputContributionResult {
  /** Σ(weight × progress01) / Σ(weight) — weighted mean achievement, 0–1 */
  composite01: number
  compositePercent: number
  totalWeight: number
  /** Σ(weight × progress01) — raw cumulative (before dividing by total weight) */
  cumulativeWeightedSum: number
  parts: ContributionPart[]
}

export function computeOutputContribution(
  outputId: string,
  links: OutputIndicatorLink[],
  indicators: WpaIndicator[],
): OutputContributionResult {
  const parts: ContributionPart[] = []
  for (const link of links.filter((l) => l.outputId === outputId)) {
    const ind = indicators.find((i) => i.id === link.indicatorId)
    if (!ind) continue
    const p = indicatorProgress01(ind)
    parts.push({
      indicatorId: ind.id,
      label: `${ind.name} · ${ind.location}`,
      weight: link.weight,
      progress01: p,
      progressPercent: Math.round(p * 1000) / 10,
      contribution: link.weight * p,
    })
  }

  const totalWeight = parts.reduce((s, x) => s + x.weight, 0)
  const cumulativeWeightedSum = parts.reduce((s, x) => s + x.contribution, 0)
  const composite01 = totalWeight > 0 ? cumulativeWeightedSum / totalWeight : 0
  return {
    composite01,
    compositePercent: Math.round(composite01 * 1000) / 10,
    totalWeight,
    cumulativeWeightedSum,
    parts,
  }
}
