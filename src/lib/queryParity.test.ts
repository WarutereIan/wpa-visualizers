import { describe, expect, it } from 'vitest'
import { demoTables } from '#/lib/demoSeed'
import { runQueryDefinition } from '#/lib/queryEngine'
import type { QueryDefinition } from '#/types/data'

const households = demoTables().find((t) => t.name === 'Households')!

function makeQuery(overrides: Partial<QueryDefinition> = {}): QueryDefinition {
  return {
    id: 'parity-q',
    name: 'Parity',
    tableId: households.id,
    selectedColumns: ['district', 'beneficiaries'],
    filters: [],
    groupBy: [],
    aggregations: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('runQueryDefinition parity fixtures', () => {
  it('projects selected columns', () => {
    const rows = runQueryDefinition(households, makeQuery())
    expect(rows).toHaveLength(6)
    expect(rows[0]).toEqual({ district: 'North', beneficiaries: 1200 })
  })

  it('filters with eq and numeric gte', () => {
    const rows = runQueryDefinition(
      households,
      makeQuery({
        selectedColumns: ['district', 'beneficiaries'],
        filters: [
          { id: 'f1', column: 'program', operator: 'eq', value: 'Meals' },
          { id: 'f2', column: 'beneficiaries', operator: 'gte', value: '1200' },
        ],
      }),
    )
    expect(rows.map((r) => r.district)).toEqual(['North', 'North'])
  })

  it('groups and sums beneficiaries by district', () => {
    const rows = runQueryDefinition(
      households,
      makeQuery({
        selectedColumns: [],
        groupBy: ['district'],
        aggregations: [
          { id: 'a1', operator: 'sum', column: 'beneficiaries', alias: 'total_ben' },
        ],
      }),
    )
    const north = rows.find((r) => r.district === 'North')
    expect(north?.total_ben).toBe(2500)
  })

  it('global aggregation without group by', () => {
    const rows = runQueryDefinition(
      households,
      makeQuery({
        selectedColumns: [],
        aggregations: [{ id: 'a1', operator: 'count', column: '', alias: 'n' }],
      }),
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]?.n).toBe(6)
  })
})
