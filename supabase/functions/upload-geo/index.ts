import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { assertOrgRole } from '../_shared/orgAuth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_RAW_UPLOAD_BYTES = 15 * 1024 * 1024
const SIMPLIFY_THRESHOLD_BYTES = 3 * 1024 * 1024

const CODE_ALIASES = [
  'code',
  'ISO',
  'ISO_A3',
  'iso_a3',
  'ISO3',
  'id',
  'ADM1_PCODE',
  'shapeISO',
  'GID_0',
  'GID_1',
]
const NAME_ALIASES = [
  'name',
  'NAME',
  'NAME_EN',
  'ADMIN',
  'NAME_0',
  'NAME_1',
  'shapeName',
  'COUNTY',
  'ADM1_EN',
]

type GeoJsonFeature = {
  type: string
  properties?: Record<string, unknown> | null
  geometry: { type: string; coordinates?: unknown; geometries?: unknown[] } | null
}

type GeoJsonFeatureCollection = {
  type: 'FeatureCollection'
  features: GeoJsonFeature[]
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function hasGeometry(geom: unknown): boolean {
  if (!geom || typeof geom !== 'object') return false
  const g = geom as { type?: string; coordinates?: unknown; geometries?: unknown[] }
  if (typeof g.type !== 'string' || !g.type) return false
  if (g.type === 'GeometryCollection') {
    return Array.isArray(g.geometries) && g.geometries.some(hasGeometry)
  }
  return g.coordinates != null
}

function extractPropertyKeys(features: GeoJsonFeature[]): string[] {
  const keys = new Set<string>()
  for (const f of features) {
    if (f.properties && typeof f.properties === 'object') {
      for (const k of Object.keys(f.properties)) keys.add(k)
    }
  }
  return [...keys]
}

function fieldNamesFromKeys(keys: string[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const k of keys) out[k] = k
  return out
}

function pickDefaultTargetField(propertyKeys: string[], requested?: string): string {
  if (requested && propertyKeys.includes(requested)) return requested
  if (propertyKeys.includes('code')) return 'code'
  if (propertyKeys.includes('name')) return 'name'
  return propertyKeys[0] ?? 'code'
}

function validateCollection(input: unknown, byteSize: number): GeoJsonFeatureCollection {
  if (byteSize > MAX_RAW_UPLOAD_BYTES) {
    throw new Error('GeoJSON exceeds the 15MB upload limit')
  }
  if (!input || typeof input !== 'object') throw new Error('Expected a GeoJSON object')
  const obj = input as Record<string, unknown>
  if (obj.type !== 'FeatureCollection') throw new Error('Expected a FeatureCollection')
  if (!Array.isArray(obj.features) || obj.features.length === 0) {
    throw new Error('FeatureCollection has no features')
  }
  for (const f of obj.features) {
    if (!f || typeof f !== 'object' || !hasGeometry((f as GeoJsonFeature).geometry)) {
      throw new Error('Every feature must have a geometry')
    }
  }
  return obj as unknown as GeoJsonFeatureCollection
}

function roundCoordinates(value: unknown, decimals = 5): unknown {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const f = 10 ** decimals
    return Math.round(value * f) / f
  }
  if (Array.isArray(value)) return value.map((v) => roundCoordinates(v, decimals))
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if ('coordinates' in obj) {
      return { ...obj, coordinates: roundCoordinates(obj.coordinates, decimals) }
    }
    if (Array.isArray(obj.features)) {
      return { ...obj, features: obj.features.map((f) => roundCoordinates(f, decimals)) }
    }
    if (obj.geometry) {
      return { ...obj, geometry: roundCoordinates(obj.geometry, decimals) }
    }
    if (Array.isArray(obj.geometries)) {
      return { ...obj, geometries: obj.geometries.map((g) => roundCoordinates(g, decimals)) }
    }
  }
  return value
}

function firstAlias(props: Record<string, unknown>, aliases: string[], skip: string): string | undefined {
  for (const k of aliases) {
    if (k === skip) continue
    const v = props[k]
    if (v == null || v === '') continue
    return String(v)
  }
  return undefined
}

function fillMissingCodeName(collection: GeoJsonFeatureCollection): GeoJsonFeatureCollection {
  return {
    ...collection,
    features: collection.features.map((f) => {
      const props: Record<string, unknown> = { ...(f.properties ?? {}) }
      if (props.code == null || props.code === '') {
        const copied = firstAlias(props, CODE_ALIASES, 'code')
        if (copied != null) props.code = copied
      }
      if (props.name == null || props.name === '') {
        const copied = firstAlias(props, NAME_ALIASES, 'name')
        if (copied != null) props.name = copied
      }
      return { ...f, properties: props }
    }),
  }
}

function decodeBase64Utf8(b64: string): string {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

async function readBody(req: Request): Promise<{
  organizationId: string
  name: string
  defaultTargetField?: string
  fieldNames?: Record<string, string>
  geojson: unknown
}> {
  const ct = req.headers.get('content-type') ?? ''
  if (ct.includes('multipart/form-data')) {
    const form = await req.formData()
    const organizationId = String(form.get('organizationId') ?? '')
    const name = String(form.get('name') ?? '')
    const defaultTargetField = form.get('defaultTargetField')
      ? String(form.get('defaultTargetField'))
      : undefined
    let geojson: unknown
    const b64 = form.get('geojsonBase64')
    if (typeof b64 === 'string' && b64) {
      geojson = JSON.parse(decodeBase64Utf8(b64))
    } else {
      const file = form.get('file') ?? form.get('geojson')
      if (typeof file === 'string' && file) {
        geojson = JSON.parse(file)
      } else if (file && typeof file === 'object' && 'text' in file) {
        geojson = JSON.parse(await (file as File).text())
      }
    }
    return { organizationId, name, defaultTargetField, geojson }
  }

  const body = (await req.json()) as {
    organizationId?: string
    name?: string
    defaultTargetField?: string
    fieldNames?: Record<string, string>
    geojson?: unknown
    geojsonBase64?: string
  }
  let geojson = body.geojson
  if ((geojson == null || geojson === '') && typeof body.geojsonBase64 === 'string' && body.geojsonBase64) {
    geojson = JSON.parse(decodeBase64Utf8(body.geojsonBase64))
  }
  return {
    organizationId: body.organizationId ?? '',
    name: body.name ?? '',
    defaultTargetField: body.defaultTargetField,
    fieldNames: body.fieldNames,
    geojson,
  }
}

function statusFor(message: string): number {
  if (message === 'Forbidden') return 403
  if (message === 'Missing authorization' || message === 'Unauthorized') return 401
  if (/already exists/i.test(message)) return 409
  if (
    /exceeds|FeatureCollection|Invalid JSON|no features|geometry|Expected|Missing|Provide/i.test(
      message,
    )
  ) {
    return 400
  }
  return 500
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization' }, 401)
    }

    const parsed = await readBody(req)
    const organizationId = parsed.organizationId.trim()
    const name = parsed.name.trim()
    if (!organizationId) return jsonResponse({ error: 'Missing organizationId' }, 400)
    if (!name) return jsonResponse({ error: 'Missing name' }, 400)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
    } = await userClient.auth.getUser()
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401)

    await assertOrgRole(admin, organizationId, user.id, [
      'owner',
      'admin',
      'editor',
      'data_manager',
    ])

    const rawJson = JSON.stringify(parsed.geojson ?? '')
    const byteSize = new TextEncoder().encode(rawJson).length
    let collection = validateCollection(parsed.geojson, byteSize)
    collection = fillMissingCodeName(collection)
    if (byteSize > SIMPLIFY_THRESHOLD_BYTES) {
      collection = roundCoordinates(collection, 5) as GeoJsonFeatureCollection
    }

    const storedJson = JSON.stringify(collection)
    const storedBytes = new TextEncoder().encode(storedJson)
    const propertyKeys = extractPropertyKeys(collection.features)
    const fieldNames = parsed.fieldNames ?? fieldNamesFromKeys(propertyKeys)
    const defaultTargetField = pickDefaultTargetField(propertyKeys, parsed.defaultTargetField)

    const datasetId = crypto.randomUUID()
    const storagePath = `orgs/${organizationId}/${datasetId}.geojson`
    const publicUrl =
      `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/dimes-geo/${storagePath}`

    const { error: uploadError } = await admin.storage.from('dimes-geo').upload(storagePath, storedBytes, {
      contentType: 'application/geo+json',
      upsert: false,
    })
    if (uploadError) throw new Error(uploadError.message)

    const { data, error: insertError } = await admin
      .from('geo_datasets')
      .insert({
        id: datasetId,
        organization_id: organizationId,
        name,
        storage_path: storagePath,
        public_url: publicUrl,
        default_target_field: defaultTargetField,
        field_names: fieldNames,
        feature_count: collection.features.length,
        byte_size: storedBytes.byteLength,
        created_by: user.id,
      })
      .select('*')
      .single()

    if (insertError) {
      await admin.storage.from('dimes-geo').remove([storagePath])
      if (insertError.code === '23505') {
        throw new Error('A map with that name already exists')
      }
      throw new Error(insertError.message)
    }

    return jsonResponse(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return jsonResponse({ error: message }, statusFor(message))
  }
})
