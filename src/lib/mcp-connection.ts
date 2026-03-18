export interface McpConnectionConfig {
  appOrigin: string | null
  endpointUrl: string | null
  connectionUrl: string | null
  hasPersonalConfig: boolean
  missingEnv: string[]
  requiresPublicOrigin: boolean
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

export function resolveAppOrigin({
  envOrigin,
  forwardedProto,
  forwardedHost,
  host,
}: {
  envOrigin?: string | null
  forwardedProto?: string | null
  forwardedHost?: string | null
  host?: string | null
}) {
  if (envOrigin?.trim()) {
    return stripTrailingSlash(envOrigin.trim())
  }

  const resolvedHost = forwardedHost?.trim() || host?.trim()
  if (!resolvedHost) return null

  const protocol = forwardedProto?.trim() || (resolvedHost.includes('localhost') ? 'http' : 'https')
  return `${protocol}://${resolvedHost}`
}

export function buildMcpConnectionConfig({
  appOrigin,
  sharedSecret,
  userId,
}: {
  appOrigin: string | null
  sharedSecret?: string | null
  userId?: string | null
}): McpConnectionConfig {
  const normalizedOrigin = appOrigin ? stripTrailingSlash(appOrigin) : null
  const endpointUrl = normalizedOrigin ? `${normalizedOrigin}/api/mcp` : null
  const hasSharedSecret = Boolean(sharedSecret?.trim())
  const hasUserId = Boolean(userId?.trim())
  const missingEnv = [
    ...(!hasSharedSecret ? ['MCP_SHARED_SECRET'] : []),
    ...(!hasUserId ? ['MCP_USER_ID'] : []),
  ]
  const hasPersonalConfig = missingEnv.length === 0
  const requiresPublicOrigin = normalizedOrigin
    ? normalizedOrigin.includes('localhost') || normalizedOrigin.includes('127.0.0.1')
    : true

  return {
    appOrigin: normalizedOrigin,
    endpointUrl,
    connectionUrl:
      endpointUrl && hasPersonalConfig && sharedSecret
        ? `${endpointUrl}?token=${encodeURIComponent(sharedSecret)}`
        : null,
    hasPersonalConfig,
    missingEnv,
    requiresPublicOrigin,
  }
}
