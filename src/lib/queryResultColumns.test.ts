import { describe, expect, it } from 'vitest'
import { queryResultColumns } from '#/lib/queryResultColumns'
import type { QueryDefinition } from '#/types/data'

function makeQuery(partial: Partial<QueryDefinition>): QueryDefinition {
  return {
    id: 'q1',
    name: 'Test',
    tableId: 't1',
    selectedColumns: [],
    filters: [],
    groupBy: [],
    aggregations: [],
    createdAt: '',
    updatedAt: '',
    ...partial,
  }
}

describe('queryResultColumns', () => {
  it('returns selectedColumns when there are no aggregations', () => {
    expect(
      queryResultColumns(
        makeQuery({ selectedColumns: ['district', 'beneficiaries'] }),
      ),
    ).toEqual(['district', 'beneficiaries'])
  })

  it('returns aggregation aliases only when there is no groupBy', () => {
    expect(
      queryResultColumns(
        makeQuery({
          selectedColumns: ['beneficiaries'],
          aggregations: [
            { id: 'a1', operator: 'sum', column: 'beneficiaries', alias: 'total_ben' },
          ],
        }),
      ),
    ).toEqual(['total_ben'])
  })

  it('returns groupBy columns plus aliases', () => {
    expect(
      queryResultColumns(
        makeQuery({
          selectedColumns: ['district', 'beneficiaries'],
          groupBy: ['district'],
          aggregations: [
            { id: 'a1', operator: 'sum', column: 'beneficiaries', alias: 'total_ben' },
          ],
        }),
      ),
    ).toEqual(['district', 'total_ben'])
  })

  it('falls back to operator_column when alias is blank', () => {
    expect(
      queryResultColumns(
        makeQuery({
          aggregations: [{ id: 'a1', operator: 'avg', column: 'score', alias: '  ' }],
        }),
      ),
    ).toEqual(['avg_score'])
  })
})
