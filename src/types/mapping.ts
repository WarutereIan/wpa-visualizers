/** User-created map / geography views (dataset-backed or iframe). */

export type MappingSource = 'dataset_table' | 'external_url' | 'baseline_embed'

export interface MappingDefinition {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  source: MappingSource
  /** `tbl-*` id from data store when `dataset_table` */
  dataTableId?: string | null
  /** Columns containing WGS84 latitude / longitude (numbers or parseable strings) */
  latitudeColumn?: string | null
  longitudeColumn?: string | null
  /** Optional column used for marker popups / labels */
  labelColumn?: string | null
  /** Full URL when `external_url` */
  externalMapUrl?: string | null
}
