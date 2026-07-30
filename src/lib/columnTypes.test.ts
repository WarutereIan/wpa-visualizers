import { describe, expect, it } from 'vitest'
import { inferColumnType, inferColumnsFromRows } from '#/lib/columnTypes'

describe('inferColumnType', () => {
  it('keeps uuid-like strings as string', () => {
    expect(inferColumnType('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')).toBe('string')
  })
  it('detects ISO dates', () => {
    expect(inferColumnType('2024-01-15')).toBe('date')
    expect(inferColumnType('2024-01-15T12:00:00Z')).toBe('date')
  })
  it('detects numbers', () => {
    expect(inferColumnType(42)).toBe('number')
    expect(inferColumnType('3.14')).toBe('number')
  })
  it('detects booleans', () => {
    expect(inferColumnType(true)).toBe('boolean')
  })
})

describe('inferColumnsFromRows', () => {
  it('infers per-column types from samples', () => {
    const cols = inferColumnsFromRows([
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        volts: 12,
        when: '2024-06-01',
      },
    ])
    expect(cols).toEqual([
      { name: 'id', type: 'string' },
      { name: 'volts', type: 'number' },
      { name: 'when', type: 'date' },
    ])
  })
})
