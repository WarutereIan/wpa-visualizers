export interface GeoJoinField {
  key: string
  label: string
}

export interface GeoDataset {
  id: string
  organizationId: string
  name: string
  storagePath: string
  publicUrl: string
  defaultTargetField: string
  fieldNames: Record<string, string>
  featureCount: number
  byteSize: number
  createdAt: string
  updatedAt: string
}

export type BuiltinMapId =
  | 'world-countries'
  | 'africa-countries'
  | 'kenya-counties'
  | 'kenya-subcounties'
