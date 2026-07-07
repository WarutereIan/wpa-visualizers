import { describe, expect, it } from 'vitest'
import { compileQuery } from '#/lib/queryCompiler'
import type { QueryDefinition } from '#/types/data'

const tableMeta = {
  id: '00000000-0000-4000-8000-000000000001',
  organizationId: '00000000-0000-4000-8000-000000000099',
  storageBackend: 'jsonb' as const,
  columns: [
    { name: 'district', type: 'string' as const },
    { name: 'program', type: 'string' as const },
    { name: 'beneficiaries', type: 'number' as const },
    { name: 'budget_usd', type: 'number' as const },
  ],
}

function baseQuery(overrides: Partial<QueryDefinition> = {}): QueryDefinition {
  return {
    id: 'qry-1',
    name: 'Test',
    tableId: tableMeta.id,
    selectedColumns: ['district', 'beneficiaries'],
    filters: [],
    groupBy: [],
    aggregations: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('compileQuery (jsonb)', () => {
  it('scopes to organization and table', () => {
    const { sql, params } = compileQuery(tableMeta, baseQuery())
    expect(sql).toContain('from public.data_table_rows')
    expect(sql).toContain('organization_id = $1')
    expect(sql).toContain('data_table_id = $2')
    expect(params).toEqual([tableMeta.organizationId, tableMeta.id])
  })

  it('projects selected columns with typed casts', () => {
    const { sql } = compileQuery(tableMeta, baseQuery())
    expect(sql).toContain("row_data->>'district'")
    expect(sql).toContain("row_data->>'beneficiaries')::numeric")
  })

  it('compiles eq and contains filters with params', () => {
    const { sql, params } = compileQuery(
      tableMeta,
      baseQuery({
        filters: [
          { id: 'f1', column: 'district', operator: 'eq', value: 'North' },
          { id: 'f2', column: 'program', operator: 'contains', value: 'Meal' },
        ],
      }),
    )
    expect(sql).toContain("= $3")
    expect(sql).toContain('ilike $4')
    expect(params).toContain('North')
    expect(params).toContain('%Meal%')
  })

  it('compiles group-by with sum aggregation', () => {
    const { sql } = compileQuery(
      tableMeta,
      baseQuery({
        selectedColumns: [],
        groupBy: ['district'],
        aggregations: [
          { id: 'a1', operator: 'sum', column: 'beneficiaries', alias: 'total_ben' },
        ],
      }),
    )
    expect(sql).toContain('group by district')
    expect(sql).toContain('sum(')
    expect(sql).toContain('as total_ben')
  })

  it('compiles count without column', () => {
    const { sql } = compileQuery(
      tableMeta,
      baseQuery({
        aggregations: [{ id: 'a1', operator: 'count', column: '', alias: 'row_count' }],
      }),
    )
    expect(sql).toContain('count(*) as row_count')
  })
})

describe('compileQuery (parquet)', () => {
  it('uses read_parquet from clause', () => {
    const { sql, params } = compileQuery(
      { ...tableMeta, storageBackend: 'parquet', parquetPathPattern: 's3://bucket/{org}/{id}/*.parquet' },
      baseQuery({
        filters: [{ id: 'f1', column: 'district', operator: 'eq', value: 'South' }],
      }),
    )
    expect(sql).toContain('from read_parquet($')
    expect(params.some((p) => String(p).includes(tableMeta.organizationId))).toBe(true)
  })
})
