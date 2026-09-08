import { describe, expect, it } from 'vitest'
import { applyParameters, resolveWidgetParameters, usedParameters } from '#/lib/queryParameters'
import type { QueryDefinition } from '#/types/data'

const q: QueryDefinition = {
  id: 'q1', name: 'q', tableId: 't1', selectedColumns: [], groupBy: [], aggregations: [],
  filters: [
    { id: 'f1', column: 'region', operator: 'eq', value: '', param: 'region' },
    { id: 'f2', column: 'status', operator: 'eq', value: 'active' },
  ],
  parameters: [
    { name: 'region', title: 'Region', type: 'enum', default: 'North', enumOptions: ['North', 'South'] },
    { name: 'unused', title: 'Unused', type: 'text', default: null },
  ],
  createdAt: '', updatedAt: '',
}

describe('queryParameters', () => {
  it('usedParameters only returns params referenced by filters', () => {
    expect(usedParameters(q).map(p => p.name)).toEqual(['region'])
  })

  it('applyParameters substitutes provided values', () => {
    const out = applyParameters(q, { region: 'South' })
    expect(out.filters.find(f => f.id === 'f1')?.value).toBe('South')
    expect(out.filters.find(f => f.id === 'f1')?.param).toBeUndefined()
  })

  it('falls back to the parameter default', () => {
    const out = applyParameters(q, {})
    expect(out.filters.find(f => f.id === 'f1')?.value).toBe('North')
  })

  it('drops filters with no value and no default', () => {
    const noDefault = { ...q, parameters: [{ name: 'region', title: 'R', type: 'text' as const, default: null }] }
    const out = applyParameters(noDefault, {})
    expect(out.filters.map(f => f.id)).toEqual(['f2'])
  })

  it('resolveWidgetParameters honors mapping types', () => {
    const params = q.parameters!
    const values = resolveWidgetParameters(
      params,
      {
        region: { type: 'dashboard-level', mapTo: 'global_region' },
        unused: { type: 'static', mapTo: 'unused', value: 'X' },
      },
      { global_region: 'South' },
      {},
    )
    expect(values).toEqual({ region: 'South', unused: 'X' })
  })

  it('unmapped params default to widget-level values', () => {
    const values = resolveWidgetParameters(q.parameters!, undefined, {}, { region: 'South' })
    expect(values.region).toBe('South')
  })
})
