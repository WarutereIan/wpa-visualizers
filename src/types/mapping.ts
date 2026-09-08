/** User-created map / geography views (dataset-backed, iframe, or choropleth). */

export type MappingSource = 'dataset_table' | 'external_url' | 'baseline_embed' | 'choropleth'

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
  /** Query that feeds the choropleth when `source === 'choropleth'` */
  queryId?: string | null
  /** Optional saved CHOROPLETH visualization; otherwise options are built from mapping fields */
  visualizationId?: string | null
  mapType?: string | null
  keyColumn?: string | null
  valueColumn?: string | null
  targetField?: string | null
}
