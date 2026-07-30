import { describe, expect, it } from 'vitest'
import { resolveKpiMeasure } from '#/lib/kpiMeasure'

describe('resolveKpiMeasure', () => {
  it('reads the bound field from a single aggregated row (no re-average)', () => {
    const result = resolveKpiMeasure([{ sum_volts: 120, avg_water: 3 }], 'sum_volts')
    expect(result).toEqual({
      value: 120,
      field: 'sum_volts',
      caption: 'From query · sum_volts',
      empty: false,
    })
  })

  it('auto-picks the first numeric field when measureKey is missing', () => {
    const result = resolveKpiMeasure([{ district: 'North', total_ben: 40 }], undefined)
    expect(result.value).toBe(40)
    expect(result.field).toBe('total_ben')
  })

  it('uses the first row when the query returns multiple rows', () => {
    const result = resolveKpiMeasure(
      [
        { district: 'A', total: 10 },
        { district: 'B', total: 90 },
      ],
      'total',
    )
    expect(result.value).toBe(10)
    expect(result.caption).toContain('First row')
  })

  it('returns empty when there are no rows', () => {
    expect(resolveKpiMeasure([], 'sum_volts')).toEqual({
      value: null,
      field: 'sum_volts',
      caption: 'No rows from query',
      empty: true,
    })
  })

  it('does not average multiple row values', () => {
    const result = resolveKpiMeasure([{ value: 10 }, { value: 90 }], 'value')
    expect(result.value).toBe(10)
    expect(result.value).not.toBe(50)
  })
})
