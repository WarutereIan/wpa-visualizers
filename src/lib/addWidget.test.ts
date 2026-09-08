import { describe, expect, it } from 'vitest'
import {
  defaultParameterMappings,
  filterQueriesByName,
  pickDefaultVisualization,
  textboxWidgetDraft,
  visualizationWidgetDraft,
} from '#/lib/addWidget'
import { DEFAULT_TEXT_SIZE, DEFAULT_VIZ_SIZE } from '#/lib/widgetGrid'
import type { QueryDefinition } from '#/types/data'
import type { DashboardWidget, VisualizationDefinition } from '#/types/visualization'

const widget = (col: number, row: number, sizeX: number, sizeY: number): DashboardWidget => ({
  id: `${col}-${row}`,
  dashboardId: 'd',
  visualizationId: null,
  text: 't',
  options: { position: { col, row, sizeX, sizeY } },
  createdAt: '',
  updatedAt: '',
})

const viz = (
  id: string,
  type: VisualizationDefinition['type'],
  createdAt: string,
): VisualizationDefinition => ({
  id,
  queryId: 'q1',
  type,
  name: type,
  options: {},
  createdAt,
  updatedAt: createdAt,
})

describe('defaultParameterMappings', () => {
  it('defaults each param to dashboard-level mapped to its own name', () => {
    expect(
      defaultParameterMappings([
        { name: 'region', title: 'Region', type: 'enum', default: 'North' },
        { name: 'q', title: 'Q', type: 'text', default: null },
      ]),
    ).toEqual({
      region: { type: 'dashboard-level', mapTo: 'region' },
      q: { type: 'dashboard-level', mapTo: 'q' },
    })
  })
})

describe('pickDefaultVisualization', () => {
  it('prefers the query Table visualization', () => {
    const picked = pickDefaultVisualization([
      viz('chart', 'CHART', '2026-01-02'),
      viz('table', 'TABLE', '2026-01-01'),
    ])
    expect(picked?.id).toBe('table')
  })
})

describe('visualizationWidgetDraft', () => {
  it('places a new viz widget in the first free slot at DEFAULT_VIZ_SIZE', () => {
    const draft = visualizationWidgetDraft('dash-1', [widget(0, 0, 3, 8)], 'viz-1', {
      region: { type: 'dashboard-level', mapTo: 'region' },
    })
    expect(draft).toEqual({
      dashboardId: 'dash-1',
      visualizationId: 'viz-1',
      text: null,
      options: {
        position: { col: 3, row: 0, sizeX: DEFAULT_VIZ_SIZE.sizeX, sizeY: DEFAULT_VIZ_SIZE.sizeY },
        parameterMappings: { region: { type: 'dashboard-level', mapTo: 'region' } },
      },
    })
  })
})

describe('textboxWidgetDraft', () => {
  it('places a new textbox at DEFAULT_TEXT_SIZE', () => {
    const draft = textboxWidgetDraft('dash-1', [], '# Hello')
    expect(draft).toEqual({
      dashboardId: 'dash-1',
      visualizationId: null,
      text: '# Hello',
      options: {
        position: {
          col: 0,
          row: 0,
          sizeX: DEFAULT_TEXT_SIZE.sizeX,
          sizeY: DEFAULT_TEXT_SIZE.sizeY,
        },
      },
    })
  })
})

describe('filterQueriesByName', () => {
  const queries: Pick<QueryDefinition, 'id' | 'name'>[] = [
    { id: '1', name: 'Sales by Region' },
    { id: '2', name: 'Daily orders' },
  ]

  it('filters saved queries by name case-insensitively', () => {
    expect(filterQueriesByName(queries, 'region').map((q) => q.id)).toEqual(['1'])
    expect(filterQueriesByName(queries, 'DAILY').map((q) => q.id)).toEqual(['2'])
  })
})
