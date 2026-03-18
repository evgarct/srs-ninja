import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/supabase/database.types'

type ResolvedMcpContext =
  | {
      supabase: SupabaseClient<Database>
      userId: string
      mode: 'personal-token'
    }
  | {
      supabase: SupabaseClient<Database>
      userId: string
      mode: 'session'
    }

export function getRequestToken(request: Request) {
  const url = new URL(request.url)
  const queryToken = url.searchParams.get('token')
  if (queryToken) return queryToken

  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.slice('Bearer '.length).trim()
}

export async function resolveMcpContext(request: Request): Promise<ResolvedMcpContext | null> {
  const sharedSecret = process.env.MCP_SHARED_SECRET
  const mcpUserId = process.env.MCP_USER_ID
  const requestToken = getRequestToken(request)

  if (sharedSecret && mcpUserId && requestToken === sharedSecret) {
    return {
      supabase: createAdminClient(),
      userId: mcpUserId,
      mode: 'personal-token',
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  return {
    supabase,
    userId: user.id,
    mode: 'session',
  }
}
