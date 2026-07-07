/**
 * Client-side mirror of create-shared-link / shared-link-access password hashing.
 * Server is the source of truth; this is kept as a referenceable, tested mirror.
 * NOTE: not used in production — verification happens server-side only.
 */

const PBKDF2_ITERATIONS = 100_000

export async function hashSharedLinkPassword(password: string): Promise<string> {
  const salt = crypto.randomUUID()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256,
  )
  const hex = [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('')
  return `pbkdf2:${PBKDF2_ITERATIONS}:${salt}:${hex}`
}

export async function verifySharedLinkPassword(password: string, stored: string): Promise<boolean> {
  if (!stored.startsWith('pbkdf2:')) return false
  const [, iterStr, salt, expected] = stored.split(':')
  if (!salt || !expected) return false
  const iterations = Number(iterStr) || PBKDF2_ITERATIONS
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations, hash: 'SHA-256' },
    keyMaterial,
    256,
  )
  const hex = [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('')
  return hex === expected
}
