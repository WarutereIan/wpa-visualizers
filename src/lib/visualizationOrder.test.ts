import { describe, expect, it } from 'vitest'
import {
  defaultTableVisualization,
  isDefaultTableVisualization,
  sortQueryVisualizations,
} from '#/lib/visualizationOrder'
import type { VisualizationDefinition } from '#/types/visualization'

function viz(
  patch: Partial<VisualizationDefinition> & Pick<VisualizationDefinition, 'id' | 'type'>,
): VisualizationDefinition {
  return {
    queryId: 'q1',
    name: patch.name ?? patch.type,
    options: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...patch,
  }
}

describe('visualizationOrder', () => {
  it('picks the oldest TABLE as the default', () => {
    const later = viz({ id: 't2', type: 'TABLE', createdAt: '2026-02-01T00:00:00.000Z' })
    const first = viz({ id: 't1', type: 'TABLE', createdAt: '2026-01-01T00:00:00.000Z' })
    const chart = viz({ id: 'c1', type: 'CHART' })
    expect(defaultTableVisualization([later, chart, first])?.id).toBe('t1')
    expect(isDefaultTableVisualization(later, [later, chart, first])).toBe(false)
    expect(isDefaultTableVisualization(first, [later, chart, first])).toBe(true)
  })

  it('sorts the default TABLE first', () => {
    const chart = viz({ id: 'c1', type: 'CHART' })
    const table = viz({ id: 't1', type: 'TABLE' })
    expect(sortQueryVisualizations([chart, table]).map((v) => v.id)).toEqual(['t1', 'c1'])
  })
})
