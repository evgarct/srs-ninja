import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/supabase/database.types'

export type ResolvedMcpContext = {
  supabase: SupabaseClient<Database>
  userId: string
  mode: 'oauth' | 'legacy-personal-token'
}

export function getBearerToken(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.slice('Bearer '.length).trim() || null
}

export function getLegacyQueryToken(request: Request) {
  return new URL(request.url).searchParams.get('token')?.trim() || null
}

export function validateOAuthClaims(claims: Record<string, unknown>, expectedIssuer: string) {
  const issuer = typeof claims.iss === 'string' ? claims.iss.replace(/\/$/, '') : ''
  const subject = typeof claims.sub === 'string' ? claims.sub : ''
  const clientId = typeof claims.client_id === 'string' ? claims.client_id : ''
  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud]
  if (issuer !== expectedIssuer.replace(/\/$/, '')) return { ok: false as const, reason: 'INVALID_ISSUER' }
  if (!audience.includes('authenticated')) return { ok: false as const, reason: 'INVALID_AUDIENCE' }
  if (!subject) return { ok: false as const, reason: 'MISSING_SUBJECT' }
  if (!clientId) return { ok: false as const, reason: 'MISSING_CLIENT_ID' }
  return { ok: true as const, userId: subject, clientId }
}

function createTokenClient(accessToken: string) {
  return createSupabaseClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

export async function resolveMcpContext(request: Request): Promise<ResolvedMcpContext | null> {
  const legacyToken = getLegacyQueryToken(request)
  if (legacyToken && process.env.MCP_LEGACY_TOKEN_ENABLED === 'true') {
    const sharedSecret = process.env.MCP_SHARED_SECRET
    const userId = process.env.MCP_USER_ID
    if (sharedSecret && userId && legacyToken === sharedSecret) {
      return { supabase: createAdminClient(), userId, mode: 'legacy-personal-token' }
    }
    return null
  }
  if (legacyToken) return null

  const accessToken = getBearerToken(request)
  if (!accessToken) return null
  const supabase = createTokenClient(accessToken)
  const { data, error } = await supabase.auth.getClaims(accessToken)
  if (error || !data?.claims) return null
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return null
  const validated = validateOAuthClaims(data.claims as Record<string, unknown>, `${supabaseUrl.replace(/\/$/, '')}/auth/v1`)
  if (!validated.ok) return null
  return { supabase, userId: validated.userId, mode: 'oauth' }
}
