import { describe, expect, it } from 'vitest'
import { buildMcpConnectionConfig, resolveAppOrigin } from '@/lib/mcp-connection'
describe('resolveAppOrigin', () => {
  it('prefers the explicit origin', () => expect(resolveAppOrigin({ envOrigin: 'https://echo.example/' })).toBe('https://echo.example'))
  it('uses forwarded host information', () => expect(resolveAppOrigin({ forwardedProto: 'https', forwardedHost: 'app.example.com' })).toBe('https://app.example.com'))
})
describe('buildMcpConnectionConfig', () => {
  it('exposes one token-free OAuth endpoint', () => { const config = buildMcpConnectionConfig({ appOrigin: 'https://app.example.com', supabaseUrl: 'https://project.supabase.co' }); expect(config).toMatchObject({ endpointUrl: 'https://app.example.com/api/mcp', healthUrl: 'https://app.example.com/api/mcp/health', oauthReady: true, missingEnv: [] }); expect(JSON.stringify(config)).not.toContain('?token=') })
  it('reports missing OAuth settings and localhost', () => expect(buildMcpConnectionConfig({ appOrigin: 'http://localhost:3000' })).toMatchObject({ oauthReady: false, missingEnv: ['NEXT_PUBLIC_SUPABASE_URL'], requiresPublicOrigin: true }))
})
