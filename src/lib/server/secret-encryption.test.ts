import { afterEach, describe, expect, it, vi } from 'vitest'

import { decryptSecret, encryptSecret } from './secret-encryption'

const KEY = Buffer.alloc(32, 7).toString('base64')

describe('user credential encryption', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('round-trips a secret without storing its plaintext', () => {
    vi.stubEnv('USER_CREDENTIALS_ENCRYPTION_KEY', KEY)
    const encrypted = encryptSecret('sk_private_value')

    expect(encrypted).not.toContain('sk_private_value')
    expect(decryptSecret(encrypted)).toBe('sk_private_value')
  })

  it('rejects tampered ciphertext', () => {
    vi.stubEnv('USER_CREDENTIALS_ENCRYPTION_KEY', KEY)
    const encrypted = encryptSecret('sk_private_value')
    const tampered = `${encrypted.slice(0, -2)}AA`

    expect(() => decryptSecret(tampered)).toThrow()
  })

  it('requires an exactly 32-byte encryption key', () => {
    vi.stubEnv('USER_CREDENTIALS_ENCRYPTION_KEY', Buffer.alloc(16).toString('base64'))
    expect(() => encryptSecret('secret')).toThrow('must contain 32 bytes')
  })
})
