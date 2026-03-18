import { describe, expect, it } from 'vitest'
import { getRequestToken } from '@/lib/mcp-auth'

describe('getRequestToken', () => {
  it('reads token from query string first', () => {
    const request = new Request('https://example.com/api/mcp?token=query-secret', {
      headers: {
        authorization: 'Bearer header-secret',
      },
    })

    expect(getRequestToken(request)).toBe('query-secret')
  })

  it('reads bearer token from authorization header', () => {
    const request = new Request('https://example.com/api/mcp', {
      headers: {
        authorization: 'Bearer header-secret',
      },
    })

    expect(getRequestToken(request)).toBe('header-secret')
  })

  it('returns null when no token is present', () => {
    const request = new Request('https://example.com/api/mcp')

    expect(getRequestToken(request)).toBeNull()
  })
})
