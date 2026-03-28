import { describe, expect, it } from 'vitest'
import { buildMcpConnectionConfig, resolveAppOrigin } from '@/lib/mcp-connection'
import { brand } from '@/lib/brand'

describe('resolveAppOrigin', () => {
  it('prefers explicit env origin', () => {
    expect(
      resolveAppOrigin({
        envOrigin: `https://${brand.exampleDomain}/`,
        forwardedProto: 'http',
        forwardedHost: 'localhost:3000',
      })
    ).toBe(`https://${brand.exampleDomain}`)
  })

  it('builds origin from forwarded headers', () => {
    expect(
      resolveAppOrigin({
        forwardedProto: 'https',
        forwardedHost: 'app.example.com',
      })
    ).toBe('https://app.example.com')
  })
})

describe('buildMcpConnectionConfig', () => {
  it('returns a full connection URL when personal MCP config is present', () => {
    const config = buildMcpConnectionConfig({
      appOrigin: 'https://app.example.com',
      sharedSecret: 'secret-value',
      userId: 'user-1',
    })

    expect(config.connectionUrl).toBe('https://app.example.com/api/mcp?token=secret-value')
    expect(config.hasPersonalConfig).toBe(true)
    expect(config.missingEnv).toEqual([])
    expect(config.requiresPublicOrigin).toBe(false)
  })

  it('reports missing env vars', () => {
    const config = buildMcpConnectionConfig({
      appOrigin: 'https://app.example.com',
      sharedSecret: null,
      userId: null,
    })

    expect(config.connectionUrl).toBeNull()
    expect(config.hasPersonalConfig).toBe(false)
    expect(config.missingEnv).toEqual(['MCP_SHARED_SECRET', 'MCP_USER_ID'])
  })

  it('flags localhost origins as requiring a public URL', () => {
    const config = buildMcpConnectionConfig({
      appOrigin: 'http://localhost:3000',
      sharedSecret: 'secret-value',
      userId: 'user-1',
    })

    expect(config.requiresPublicOrigin).toBe(true)
  })
})
