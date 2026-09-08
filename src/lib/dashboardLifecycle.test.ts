import { describe, expect, it } from 'vitest'
import { canArchive, canPublish, canUnpublish, nextAutoRefreshLabel } from '#/lib/dashboardLifecycle'

describe('dashboardLifecycle', () => {
  it('publish only from draft', () => {
    expect(canPublish('draft')).toBe(true)
    expect(canPublish('published')).toBe(false)
    expect(canPublish('archived')).toBe(false)
  })
  it('unpublish only from published', () => {
    expect(canUnpublish('published')).toBe(true)
    expect(canUnpublish('draft')).toBe(false)
  })
  it('archive from draft or published', () => {
    expect(canArchive('draft')).toBe(true)
    expect(canArchive('published')).toBe(true)
    expect(canArchive('archived')).toBe(false)
  })
  it('labels auto-refresh intervals', () => {
    expect(nextAutoRefreshLabel(null)).toBe('Off')
    expect(nextAutoRefreshLabel(60)).toBe('1 minute')
    expect(nextAutoRefreshLabel(1800)).toBe('30 minutes')
  })
})
