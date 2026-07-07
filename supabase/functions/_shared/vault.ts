import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

export async function storeConnectionSecret(
  admin: SupabaseClient,
  name: string,
  credentials: Record<string, unknown>,
): Promise<string | null> {
  if (Object.keys(credentials).length === 0) return null
  const { data, error } = await admin.rpc('store_connection_secret', {
    secret_payload: JSON.stringify(credentials),
    secret_name: `conn-${name}-${crypto.randomUUID()}`,
  })
  if (error) {
    console.error('vault.store_connection_secret failed', error.message)
    return null
  }
  return data as string
}

export async function readConnectionSecret(
  admin: SupabaseClient,
  secretId: string | null,
): Promise<Record<string, string>> {
  if (!secretId) return {}
  const { data, error } = await admin
    .schema('vault')
    .from('decrypted_secrets')
    .select('decrypted_secret')
    .eq('id', secretId)
    .maybeSingle()
  if (error || !data?.decrypted_secret) return {}
  try {
    const parsed = JSON.parse(data.decrypted_secret as string) as Record<string, string>
    return parsed ?? {}
  } catch {
    return {}
  }
}
