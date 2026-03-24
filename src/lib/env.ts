/** Baseline program map URL (iframe). Override with VITE_BASELINE_MAP_URL */
export function getBaselineMapUrl(): string {
  const url = import.meta.env.VITE_BASELINE_MAP_URL as string | undefined
  if (url && url.trim()) return url.trim()
  return 'https://www.openstreetmap.org/export/embed.html?bbox=-5,35,40,60&layer=mapnik'
}
