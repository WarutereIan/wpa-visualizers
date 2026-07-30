/** Normalize aggregation / field aliases — keep in sync with src/lib/slugAlias.ts */
export function slugAlias(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
}
