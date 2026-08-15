import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { McpGuidePage } from '@/components/mcp-guide-page'
import { buildMcpConnectionConfig, resolveAppOrigin } from '@/lib/mcp-connection'
import { createClient } from '@/lib/supabase/server'

export default async function McpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [requestHeaders, t] = await Promise.all([headers(), getTranslations('mcpGuidePage')])
  const appOrigin = resolveAppOrigin({
    envOrigin: process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? null,
    forwardedProto: requestHeaders.get('x-forwarded-proto'),
    forwardedHost: requestHeaders.get('x-forwarded-host'),
    host: requestHeaders.get('host'),
  })
  const config = buildMcpConnectionConfig({
    appOrigin,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    legacyEnabled: process.env.MCP_LEGACY_TOKEN_ENABLED === 'true',
  })

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 pb-28">
      <h1 className="mb-2 text-3xl font-semibold">{t('pageTitle')}</h1>
      <p className="mb-8 max-w-2xl text-muted-foreground">{t('pageDescription')}</p>
      <McpGuidePage {...config} />
    </main>
  )
}
