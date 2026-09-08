import { useMemo } from 'react'
import { buildChoroplethAvailableMaps } from '#/lib/geo/mapRegistry'
import type { ChoroplethAvailableMaps } from '#/lib/geo/mapRegistry'
import { useWorkspaceGeoDatasets } from '#/hooks/useWorkspaceGeoDatasets'

export function useChoroplethMaps(): ChoroplethAvailableMaps {
  const { datasets } = useWorkspaceGeoDatasets()

  return useMemo(
    () =>
      buildChoroplethAvailableMaps(
        datasets.map((dataset) => ({
          id: dataset.id,
          name: dataset.name,
          url: dataset.publicUrl,
          fieldNames: dataset.fieldNames,
        })),
      ),
    [datasets],
  )
}
