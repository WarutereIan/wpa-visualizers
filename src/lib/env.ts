/** Baseline program map URL (iframe). Override with VITE_BASELINE_MAP_URL */
export function getBaselineMapUrl(): string {
  const url = import.meta.env.VITE_BASELINE_MAP_URL as string | undefined
  if (url && url.trim()) return url.trim()
  return 'https://www.openstreetmap.org/export/embed.html?bbox=-5,35,40,60&layer=mapnik'
}

export function getSupabaseUrl(): string | undefined {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  return url?.trim() || undefined
}

export function getSupabaseAnonKey(): string | undefined {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  return key?.trim() || undefined
}

/** When false, the app runs in demo mode (localStorage only, no auth gate). */
export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey())
}
