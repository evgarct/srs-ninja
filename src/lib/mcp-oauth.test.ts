import { afterEach, describe, expect, it } from 'vitest'
import { getMcpAuthenticateHeader, getMcpProtectedResourceMetadata } from '@/lib/mcp-oauth'

const original = { ...process.env }
afterEach(() => { process.env = { ...original } })

describe('MCP OAuth metadata', () => {
  it('publishes the canonical protected resource', () => {
    process.env.APP_URL = 'https://echo.example'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
    expect(getMcpProtectedResourceMetadata()).toMatchObject({ resource: 'https://echo.example/api/mcp', authorization_servers: ['https://project.supabase.co/auth/v1'], bearer_methods_supported: ['header'] })
    expect(getMcpAuthenticateHeader()).toContain('https://echo.example/.well-known/oauth-protected-resource')
  })
})
