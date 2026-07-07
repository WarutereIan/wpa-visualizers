import { describe, expect, it } from 'vitest'
import { hashSharedLinkPassword, verifySharedLinkPassword } from './sharedLinkCrypto'

describe('sharedLinkCrypto', () => {
  it('hashes and verifies a password with PBKDF2', async () => {
    const stored = await hashSharedLinkPassword('secret123')
    expect(stored.startsWith('pbkdf2:')).toBe(true)
    expect(await verifySharedLinkPassword('secret123', stored)).toBe(true)
    expect(await verifySharedLinkPassword('wrong', stored)).toBe(false)
  })

  it('rejects malformed or legacy stored hash', async () => {
    expect(await verifySharedLinkPassword('x', 'bad')).toBe(false)
    expect(await verifySharedLinkPassword('x', 'salt:hex')).toBe(false)
  })
})
