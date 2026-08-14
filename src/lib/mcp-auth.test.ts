import { describe, expect, it } from 'vitest'
import { getBearerToken, getLegacyQueryToken, validateOAuthClaims } from '@/lib/mcp-auth'

describe('MCP token parsing', () => {
  it('separates OAuth bearer and legacy query credentials', () => {
    const request = new Request('https://example.com/api/mcp?token=legacy', { headers: { authorization: 'Bearer oauth' } })
    expect(getBearerToken(request)).toBe('oauth')
    expect(getLegacyQueryToken(request)).toBe('legacy')
  })
  it('returns null without a bearer token', () => expect(getBearerToken(new Request('https://example.com/api/mcp'))).toBeNull())
})

describe('validateOAuthClaims', () => {
  const valid = { iss: 'https://project.supabase.co/auth/v1', aud: 'authenticated', sub: 'user-1', client_id: 'client-1' }
  it('accepts the Supabase OAuth token contract', () => {
    expect(validateOAuthClaims(valid, valid.iss)).toEqual({ ok: true, userId: 'user-1', clientId: 'client-1' })
  })
  it.each([
    [{ ...valid, iss: 'https://evil.example/auth/v1' }, 'INVALID_ISSUER'],
    [{ ...valid, aud: 'anon' }, 'INVALID_AUDIENCE'],
    [{ ...valid, sub: undefined }, 'MISSING_SUBJECT'],
    [{ ...valid, client_id: undefined }, 'MISSING_CLIENT_ID'],
  ] as const)('rejects invalid claims', (claims, reason) => {
    expect(validateOAuthClaims(claims as Record<string, unknown>, valid.iss)).toEqual({ ok: false, reason })
  })
})
