import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { OAuthConsentCard } from '@/components/oauth-consent-card'

async function decideOAuthAuthorization(formData: FormData) {
  'use server'
  const authorizationId = formData.get('authorization_id')
  const decision = formData.get('decision')
  if (typeof authorizationId !== 'string' || (decision !== 'approve' && decision !== 'deny')) redirect('/oauth/consent?error=invalid_request')
  const supabase = await createClient()
  const response = decision === 'approve'
    ? await supabase.auth.oauth.approveAuthorization(authorizationId, { skipBrowserRedirect: true })
    : await supabase.auth.oauth.denyAuthorization(authorizationId, { skipBrowserRedirect: true })
  if (response.error || !response.data?.redirect_url) redirect(`/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}&error=consent_failed`)
  redirect(response.data.redirect_url)
}

export default async function OAuthConsentPage({ searchParams }: { searchParams: Promise<{ authorization_id?: string; error?: string }> }) {
  const params = await searchParams
  const authorizationId = params.authorization_id
  const t = await getTranslations('oauthConsent')
  if (!authorizationId) return <main className="flex min-h-screen items-center justify-center p-4"><p>{t('invalidRequest')}</p></main>

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/oauth/consent?authorization_id=${authorizationId}`)}`)
  const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId)
  if (error || !data) return <main className="flex min-h-screen items-center justify-center p-4"><p>{t('invalidRequest')}</p></main>
  if (!('authorization_id' in data)) redirect(data.redirect_url)

  const labels = { eyebrow: t('eyebrow'), title: t('title'), description: t('description'), permissions: t('permissions'), readDecks: t('readDecks'), readDrafts: t('readDrafts'), createDrafts: t('createDrafts'), noPublish: t('noPublish'), approve: t('approve'), deny: t('deny'), redirectLabel: t('redirectLabel') }
  return <main className="flex min-h-screen items-center justify-center p-4"><OAuthConsentCard authorizationId={authorizationId} clientName={data.client.name} clientUri={data.client.uri} redirectUri={data.redirect_uri} labels={labels} action={decideOAuthAuthorization} /></main>
}
