import { describe, expect, it } from 'vitest'
import { slugAlias } from '#/lib/slugAlias'

describe('slugAlias', () => {
  it('lowercases and replaces non-alnum with underscore', () => {
    expect(slugAlias('sum_Response ID')).toBe('sum_response_id')
  })
  it('collapses repeated underscores and trims edges', () => {
    expect(slugAlias('__Sum  Volts__')).toBe('sum_volts')
  })
})
