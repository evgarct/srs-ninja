export interface McpConnectionConfig { appOrigin: string | null; endpointUrl: string | null; healthUrl: string | null; oauthReady: boolean; missingEnv: string[]; requiresPublicOrigin: boolean; legacyEnabled: boolean }
function stripTrailingSlash(value: string) { return value.replace(/\/+$/, '') }
export function resolveAppOrigin({ envOrigin, forwardedProto, forwardedHost, host }: { envOrigin?: string | null; forwardedProto?: string | null; forwardedHost?: string | null; host?: string | null }) {
  if (envOrigin?.trim()) return stripTrailingSlash(envOrigin.trim())
  const resolvedHost = forwardedHost?.trim() || host?.trim(); if (!resolvedHost) return null
  return `${forwardedProto?.trim() || (resolvedHost.includes('localhost') ? 'http' : 'https')}://${resolvedHost}`
}
export function buildMcpConnectionConfig({ appOrigin, supabaseUrl, legacyEnabled = false }: { appOrigin: string | null; supabaseUrl?: string | null; legacyEnabled?: boolean }): McpConnectionConfig {
  const normalizedOrigin = appOrigin ? stripTrailingSlash(appOrigin) : null
  const missingEnv = [...(!normalizedOrigin ? ['APP_URL'] : []), ...(!supabaseUrl?.trim() ? ['NEXT_PUBLIC_SUPABASE_URL'] : [])]
  return { appOrigin: normalizedOrigin, endpointUrl: normalizedOrigin ? `${normalizedOrigin}/api/mcp` : null, healthUrl: normalizedOrigin ? `${normalizedOrigin}/api/mcp/health` : null, oauthReady: missingEnv.length === 0, missingEnv, requiresPublicOrigin: normalizedOrigin ? /localhost|127\.0\.0\.1/.test(normalizedOrigin) : true, legacyEnabled }
}
