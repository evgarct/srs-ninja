import { resolveAppOrigin } from '@/lib/app-origin'

export function getMcpResourceUrl() { return `${resolveAppOrigin()}/api/mcp` }

export function getMcpProtectedResourceMetadata() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
  if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
  return {
    resource: getMcpResourceUrl(),
    authorization_servers: [`${supabaseUrl}/auth/v1`],
    bearer_methods_supported: ['header'],
    resource_documentation: `${resolveAppOrigin()}/docs/mcp`,
  }
}

export function getMcpAuthenticateHeader(error: 'invalid_token' | 'insufficient_scope' = 'invalid_token') {
  return `Bearer resource_metadata="${resolveAppOrigin()}/.well-known/oauth-protected-resource", error="${error}"`
}
