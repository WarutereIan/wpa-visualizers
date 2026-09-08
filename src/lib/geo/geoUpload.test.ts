import { describe, expect, it } from 'vitest'
import {
  formatByteSize,
  isAcceptedGeoFileName,
  nameFromGeoFile,
  validateGeoFile,
} from '#/lib/geo/geoUpload'
import { MAX_RAW_UPLOAD_BYTES } from '#/lib/geo/geojsonValidate'

describe('geoUpload helpers', () => {
  it('accepts .geojson and .json names', () => {
    expect(isAcceptedGeoFileName('counties.geojson')).toBe(true)
    expect(isAcceptedGeoFileName('COUNTIES.JSON')).toBe(true)
    expect(isAcceptedGeoFileName('counties.shp')).toBe(false)
    expect(isAcceptedGeoFileName('readme.txt')).toBe(false)
  })

  it('derives a display name from the file name', () => {
    expect(nameFromGeoFile('kenya-counties.geojson')).toBe('kenya-counties')
    expect(nameFromGeoFile('.json')).toBe('Custom map')
  })

  it('formats byte sizes', () => {
    expect(formatByteSize(512)).toBe('512 B')
    expect(formatByteSize(2048)).toBe('2.0 KB')
    expect(formatByteSize(2 * 1024 * 1024)).toBe('2.0 MB')
  })

  it('rejects oversized files before parsing JSON', async () => {
    const file = new File(['{}'], 'huge.geojson', { type: 'application/geo+json' })
    Object.defineProperty(file, 'size', { value: MAX_RAW_UPLOAD_BYTES + 1 })
    const result = await validateGeoFile(file)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/15MB/i)
  })

  it('validates a FeatureCollection file', async () => {
    const collection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { code: '001', name: 'Nairobi' },
          geometry: { type: 'Point', coordinates: [36.8, -1.3] },
        },
      ],
    }
    const file = new File([JSON.stringify(collection)], 'nairobi.geojson', {
      type: 'application/geo+json',
    })
    const result = await validateGeoFile(file)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.featureCount).toBe(1)
    expect(result.propertyKeys.sort()).toEqual(['code', 'name'])
  })
})
