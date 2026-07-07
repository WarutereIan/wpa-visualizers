import { getSupabase } from '#/lib/supabaseClient'
import { logSupabaseError } from '#/lib/supabaseErrors'
import { getSupabaseAnonKey, getSupabaseUrl } from '#/lib/env'

export async function invokeEdgeFunction<T>(
  name: string,
  body: Record<string, unknown>,
): Promise<T> {
  const supabase = getSupabase()
  if (!supabase) throw new Error('Supabase is not configured')

  const { data, error } = await supabase.functions.invoke(name, { body })
  if (error) {
    logSupabaseError(`functions.${name}`, error, body)
    throw error
  }
  return data as T
}

/** Public edge functions (e.g. shared-link-access) — no user session required. */
export async function invokePublicEdgeFunction<T>(
  name: string,
  body: Record<string, unknown>,
): Promise<T> {
  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()
  if (!url || !key) throw new Error('Supabase is not configured')

  const res = await fetch(`${url.replace(/\/$/, '')}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? `Function error ${res.status}`)
  return data as T
}
