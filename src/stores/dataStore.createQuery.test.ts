import { describe, expect, it } from 'vitest'
import { useDataStore } from '#/stores/dataStore'

describe('dataStore createQuery default TABLE viz', () => {
  it('creates a default Table visualization for every new query', () => {
    const created = useDataStore.getState().createQuery({
      name: 'Task 7 query',
      tableId: 'tbl-households',
      selectedColumns: ['district'],
      filters: [],
      groupBy: [],
      aggregations: [],
    })
    const vizs = useDataStore.getState().listByQuery(created.id)
    expect(vizs).toHaveLength(1)
    expect(vizs[0]).toMatchObject({
      queryId: created.id,
      type: 'TABLE',
      name: 'Table',
      options: {},
    })
  })
})
