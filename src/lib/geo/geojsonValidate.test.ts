import { describe, expect, it } from 'vitest'
import {
  extractPropertyKeys,
  featuresHaveGeometries,
  fillMissingCodeName,
  MAX_RAW_UPLOAD_BYTES,
  pickDefaultTargetField,
  roundCoordinates,
  SIMPLIFY_THRESHOLD_BYTES,
  TARGET_SIMPLIFIED_BYTES,
  validateFeatureCollection,
  type GeoJsonFeatureCollection,
} from '#/lib/geo/geojsonValidate'

const kenyaCounty: GeoJsonFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { ISO_A3: 'KEN', NAME_1: 'Nairobi', pop: 4_397_073 },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [36.7, -1.3],
            [36.9, -1.3],
            [36.9, -1.2],
            [36.7, -1.2],
            [36.7, -1.3],
          ],
        ],
      },
    },
  ],
}

describe('size constants', () => {
  it('documents 15MB raw / 3MB simplify / 5MB target', () => {
    expect(MAX_RAW_UPLOAD_BYTES).toBe(15 * 1024 * 1024)
    expect(SIMPLIFY_THRESHOLD_BYTES).toBe(3 * 1024 * 1024)
    expect(TARGET_SIMPLIFIED_BYTES).toBe(5 * 1024 * 1024)
  })
})

describe('validateFeatureCollection', () => {
  it('accepts a FeatureCollection with geometries and extracts property keys', () => {
    const result = validateFeatureCollection(kenyaCounty)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.featureCount).toBe(1)
    expect(result.propertyKeys.sort()).toEqual(['ISO_A3', 'NAME_1', 'pop'].sort())
    expect(result.byteSize).toBeGreaterThan(0)
  })

  it('parses a JSON string', () => {
    const result = validateFeatureCollection(JSON.stringify(kenyaCounty))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.featureCount).toBe(1)
  })

  it('rejects invalid JSON strings', () => {
    const result = validateFeatureCollection('{not json')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/invalid json/i)
  })

  it('rejects non-FeatureCollection types', () => {
    const result = validateFeatureCollection({ type: 'Feature', geometry: null, properties: {} })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/FeatureCollection/i)
  })

  it('rejects empty features arrays', () => {
    const result = validateFeatureCollection({ type: 'FeatureCollection', features: [] })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/no features/i)
  })

  it('rejects features missing geometry', () => {
    const result = validateFeatureCollection({
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: { code: 'x' }, geometry: null }],
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/geometry/i)
  })

  it('rejects uploads over the raw size cap without allocating a huge payload', () => {
    const result = validateFeatureCollection(kenyaCounty, {
      byteSize: MAX_RAW_UPLOAD_BYTES + 1,
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/15\s*MB/i)
  })
})

describe('extractPropertyKeys / featuresHaveGeometries', () => {
  it('unions property keys across features', () => {
    expect(
      extractPropertyKeys([
        { type: 'Feature', properties: { a: 1 }, geometry: { type: 'Point', coordinates: [0, 0] } },
        { type: 'Feature', properties: { b: 2, a: 3 }, geometry: { type: 'Point', coordinates: [1, 1] } },
      ]).sort(),
    ).toEqual(['a', 'b'])
  })

  it('requires every feature to have a geometry', () => {
    expect(
      featuresHaveGeometries([
        { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] } },
      ]),
    ).toBe(true)
    expect(
      featuresHaveGeometries([{ type: 'Feature', geometry: null }]),
    ).toBe(false)
  })
})

describe('roundCoordinates', () => {
  it('rounds nested coordinate arrays to 5 decimal places', () => {
    const rounded = roundCoordinates(
      {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: { type: 'Point', coordinates: [36.821946123, -1.292065987] },
          },
        ],
      },
      5,
    ) as GeoJsonFeatureCollection
    expect(rounded.features[0].geometry?.coordinates).toEqual([36.82195, -1.29207])
  })
})

describe('fillMissingCodeName', () => {
  it('copies common aliases onto code and name when those keys are missing', () => {
    const filled = fillMissingCodeName(kenyaCounty)
    expect(filled.features[0].properties?.code).toBe('KEN')
    expect(filled.features[0].properties?.name).toBe('Nairobi')
  })
})

describe('pickDefaultTargetField', () => {
  it('prefers an explicit field, then code, then name, then the first key', () => {
    expect(pickDefaultTargetField(['ISO_A3', 'NAME_1'], 'NAME_1')).toBe('NAME_1')
    expect(pickDefaultTargetField(['code', 'name'])).toBe('code')
    expect(pickDefaultTargetField(['name'])).toBe('name')
    expect(pickDefaultTargetField(['ISO_A3'])).toBe('ISO_A3')
    expect(pickDefaultTargetField([])).toBe('code')
  })
})
