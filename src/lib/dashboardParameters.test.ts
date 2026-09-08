import { describe, expect, it } from 'vitest'
import { collectDashboardParameters, defaultParameterValues } from '#/lib/dashboardParameters'
import type { QueryDefinition } from '#/types/data'
import type { DashboardWidget, VisualizationDefinition } from '#/types/visualization'

const query = (id: string, extras: Partial<QueryDefinition> = {}): QueryDefinition => ({
  id,
  name: id,
  tableId: 't1',
  selectedColumns: [],
  filters: [{ id: 'f1', column: 'region', operator: 'eq', value: '', param: 'region' }],
  groupBy: [],
  aggregations: [],
  parameters: [
    { name: 'region', title: 'Region', type: 'enum', default: 'North', enumOptions: ['North', 'South'] },
  ],
  createdAt: '',
  updatedAt: '',
  ...extras,
})

const viz = (id: string, queryId: string): VisualizationDefinition => ({
  id,
  queryId,
  type: 'TABLE',
  name: id,
  options: {},
  createdAt: '',
  updatedAt: '',
})

const widget = (
  id: string,
  visualizationId: string | null,
  mappings?: DashboardWidget['options']['parameterMappings'],
): DashboardWidget => ({
  id,
  dashboardId: 'd1',
  visualizationId,
  text: visualizationId ? null : 'note',
  options: {
    position: { col: 0, row: 0, sizeX: 3, sizeY: 8 },
    parameterMappings: mappings,
  },
  createdAt: '',
  updatedAt: '',
})

describe('collectDashboardParameters', () => {
  it('groups dashboard-level mappings by mapTo; first definition wins', () => {
    const q1 = query('q1')
    const q2 = query('q2', {
      parameters: [{ name: 'region', title: 'Later title', type: 'text', default: 'West' }],
    })
    const result = collectDashboardParameters(
      [
        widget('w1', 'v1', { region: { type: 'dashboard-level', mapTo: 'global_region' } }),
        widget('w2', 'v2', { region: { type: 'dashboard-level', mapTo: 'global_region' } }),
      ],
      [viz('v1', 'q1'), viz('v2', 'q2')],
      [q1, q2],
    )

    expect(result).toEqual([
      { name: 'global_region', title: 'Region', type: 'enum', default: 'North', enumOptions: ['North', 'South'] },
    ])
  })

  it('ignores widget-level, static, and unused parameters', () => {
    const q = query('q1', {
      filters: [
        { id: 'f1', column: 'region', operator: 'eq', value: '', param: 'region' },
        { id: 'f2', column: 'status', operator: 'eq', value: '', param: 'status' },
      ],
      parameters: [
        { name: 'region', title: 'Region', type: 'enum', default: 'North' },
        { name: 'status', title: 'Status', type: 'text', default: 'open' },
        { name: 'unused', title: 'Unused', type: 'text', default: 'x' },
      ],
    })
    const result = collectDashboardParameters(
      [
        widget('w1', 'v1', {
          region: { type: 'widget-level', mapTo: 'region' },
          status: { type: 'static', mapTo: 'status', value: 'closed' },
        }),
      ],
      [viz('v1', 'q1')],
      [q],
    )
    expect(result).toEqual([])
  })

  it('skips textbox widgets and missing queries', () => {
    const result = collectDashboardParameters(
      [widget('text', null), widget('orphan', 'missing-viz')],
      [],
      [],
    )
    expect(result).toEqual([])
  })
})

describe('defaultParameterValues', () => {
  it('seeds each parameter with its default', () => {
    expect(
      defaultParameterValues([
        { name: 'region', title: 'Region', type: 'enum', default: 'North' },
        { name: 'q', title: 'Q', type: 'text', default: null },
      ]),
    ).toEqual({ region: 'North', q: null })
  })
})
