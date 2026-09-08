import type { GeoDataset } from '#/types/geo'

/**
 * Placeholder until Task 4 wires demo store + Supabase geo datasets.
 * Returns an empty list so built-in choropleth maps still register.
 */
export function useWorkspaceGeoDatasets() {
  return {
    datasets: [] as GeoDataset[],
    isLoading: false,
  }
}
