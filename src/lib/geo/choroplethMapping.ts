import type { MappingDefinition } from '#/types/mapping'
import type { VisualizationDefinition } from '#/types/visualization'

export type MappingChoroplethOptions = {
  queryId: string | null
  visualizationId: string | null
  mapType: string | null
  keyColumn: string | null
  valueColumn: string | null
  targetField: string | null
}

function asNullableString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  return null
}

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim())
}

export function isChoroplethMappingConfigured(
  mapping: Pick<
    MappingDefinition,
    'queryId' | 'mapType' | 'keyColumn' | 'valueColumn' | 'targetField'
  >,
): boolean {
  return (
    hasText(mapping.queryId) &&
    hasText(mapping.mapType) &&
    hasText(mapping.keyColumn) &&
    hasText(mapping.valueColumn) &&
    hasText(mapping.targetField)
  )
}

export function buildChoroplethRendererOptions(
  mapping: MappingDefinition,
  visualization?: VisualizationDefinition | null,
): Record<string, unknown> {
  if (visualization?.type === 'CHOROPLETH') {
    return visualization.options ?? {}
  }
  return {
    mapType: mapping.mapType ?? null,
    keyColumn: mapping.keyColumn ?? null,
    valueColumn: mapping.valueColumn ?? null,
    targetField: mapping.targetField ?? null,
  }
}

export function mappingOptionsFromDefinition(mapping: MappingDefinition): MappingChoroplethOptions {
  return {
    queryId: mapping.queryId ?? null,
    visualizationId: mapping.visualizationId ?? null,
    mapType: mapping.mapType ?? null,
    keyColumn: mapping.keyColumn ?? null,
    valueColumn: mapping.valueColumn ?? null,
    targetField: mapping.targetField ?? null,
  }
}

export function mappingFieldsFromOptions(options: unknown): MappingChoroplethOptions {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    return {
      queryId: null,
      visualizationId: null,
      mapType: null,
      keyColumn: null,
      valueColumn: null,
      targetField: null,
    }
  }
  const record = options as Record<string, unknown>
  return {
    queryId: asNullableString(record.queryId),
    visualizationId: asNullableString(record.visualizationId),
    mapType: asNullableString(record.mapType),
    keyColumn: asNullableString(record.keyColumn),
    valueColumn: asNullableString(record.valueColumn),
    targetField: asNullableString(record.targetField),
  }
}
