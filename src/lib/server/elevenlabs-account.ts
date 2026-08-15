import 'server-only'

import type { Language } from '@/lib/types'
import { createAdminClient } from '@/lib/supabase/admin'
import { decryptSecret } from '@/lib/server/secret-encryption'
import { getTtsLanguageConfig } from '@/lib/tts-config'
import type { ElevenLabsVoice } from '@/lib/elevenlabs-types'

export type ResolvedElevenLabsTts = {
  apiKey: string
  config: NonNullable<ReturnType<typeof getTtsLanguageConfig>>
}

export async function fetchElevenLabsAccount(apiKey: string) {
  const headers = { 'xi-api-key': apiKey }
  const userResponse = await fetch('https://api.elevenlabs.io/v1/user/subscription', { headers, cache: 'no-store' })
  if (!userResponse.ok) throw new Error('ElevenLabs API key is invalid or lacks access')
  const user = await userResponse.json() as { subscription?: { tier?: string } }
  const rawVoices: unknown[] = []
  let nextPageToken: string | undefined
  do {
    const url = new URL('https://api.elevenlabs.io/v2/voices')
    url.searchParams.set('page_size', '100')
    if (nextPageToken) url.searchParams.set('next_page_token', nextPageToken)
    const response = await fetch(url, { headers, cache: 'no-store' })
    if (!response.ok) throw new Error('ElevenLabs API key is invalid or lacks access')
    const page = await response.json() as { voices?: unknown[]; has_more?: boolean; next_page_token?: string }
    rawVoices.push(...(page.voices ?? []))
    nextPageToken = page.has_more && page.next_page_token ? page.next_page_token : undefined
  } while (nextPageToken)

  const safeVoices = rawVoices.flatMap((voice) => {
    if (!voice || typeof voice !== 'object') return []
    const candidate = voice as Record<string, unknown>
    if (typeof candidate.voice_id !== 'string' || typeof candidate.name !== 'string') return []
    const labels = candidate.labels && typeof candidate.labels === 'object' && !Array.isArray(candidate.labels)
      ? Object.fromEntries(Object.entries(candidate.labels).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
      : {}
    const availableForTiers = Array.isArray(candidate.available_for_tiers)
      ? candidate.available_for_tiers.filter((tier): tier is string => typeof tier === 'string')
      : []
    const verifiedLanguages = Array.isArray(candidate.verified_languages)
      ? candidate.verified_languages.flatMap((item) => {
        if (!item || typeof item !== 'object') return []
        const language = item as Record<string, unknown>
        if (typeof language.language !== 'string') return []
        return [{
          language: language.language,
          ...(typeof language.model_id === 'string' ? { model_id: language.model_id } : {}),
          ...(typeof language.accent === 'string' ? { accent: language.accent } : {}),
          ...(typeof language.locale === 'string' ? { locale: language.locale } : {}),
        }]
      })
      : []
    return [{
      voice_id: candidate.voice_id,
      name: candidate.name,
      ...(typeof candidate.category === 'string' ? { category: candidate.category } : {}),
      labels,
      available_for_tiers: availableForTiers,
      verified_languages: verifiedLanguages,
      ...(typeof candidate.preview_url === 'string' ? { preview_url: candidate.preview_url } : {}),
    } satisfies ElevenLabsVoice]
  })
  return { tier: user.subscription?.tier ?? (user as { tier?: string }).tier ?? 'unknown', voices: safeVoices }
}

export async function resolveElevenLabsTts(userId: string, language: Language): Promise<ResolvedElevenLabsTts | null> {
  const admin = createAdminClient()
  const { data, error } = await admin.from('user_elevenlabs_settings').select('*').eq('user_id', userId).maybeSingle()
  if (error || !data) return null
  const voiceId = {
    english: data.english_voice_id,
    czech: data.czech_voice_id,
    turkish: data.turkish_voice_id,
  }[language]
  if (!voiceId) return null
  const config = getTtsLanguageConfig(language, voiceId)
  if (!config) return null
  return { apiKey: decryptSecret(data.encrypted_api_key), config }
}

export async function resolveValidatedElevenLabsTts(
  userId: string,
  language: Language
): Promise<ResolvedElevenLabsTts | null> {
  const resolved = await resolveElevenLabsTts(userId, language)
  if (!resolved) return null

  const account = await fetchElevenLabsAccount(resolved.apiKey)
  const voiceIsAvailable = account.voices.some(
    (voice) => voice.voice_id === resolved.config.voiceId
  )

  return voiceIsAvailable ? resolved : null
}
