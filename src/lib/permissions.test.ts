import { describe, expect, it } from 'vitest'
import { canEditDashboards } from '#/lib/permissions'

describe('canEditDashboards', () => {
  it('allows demo (unsigned) editing', () => {
    expect(canEditDashboards(null, false)).toBe(true)
  })

  it('allows owner/admin/editor when signed in', () => {
    expect(canEditDashboards('owner', true)).toBe(true)
    expect(canEditDashboards('admin', true)).toBe(true)
    expect(canEditDashboards('editor', true)).toBe(true)
    expect(canEditDashboards('data_manager', true)).toBe(true)
  })

  it('blocks viewers and guests', () => {
    expect(canEditDashboards('viewer', true)).toBe(false)
    expect(canEditDashboards('guest', true)).toBe(false)
    expect(canEditDashboards('partner', true)).toBe(false)
    expect(canEditDashboards(null, true)).toBe(false)
  })
})
