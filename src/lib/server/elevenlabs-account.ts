import 'server-only'

import type { Language } from '@/lib/types'
import { createAdminClient } from '@/lib/supabase/admin'
import { decryptSecret } from '@/lib/server/secret-encryption'
import { getTtsLanguageConfig } from '@/lib/tts-config'
import type { ElevenLabsVoice } from '@/lib/elevenlabs-types'

export async function fetchElevenLabsAccount(apiKey: string) {
  const headers = { 'xi-api-key': apiKey }
  const [userResponse, voicesResponse] = await Promise.all([
    fetch('https://api.elevenlabs.io/v1/user', { headers, cache: 'no-store' }),
    fetch('https://api.elevenlabs.io/v1/voices', { headers, cache: 'no-store' }),
  ])
  if (!userResponse.ok || !voicesResponse.ok) throw new Error('ElevenLabs API key is invalid or lacks access')
  const user = await userResponse.json() as { subscription?: { tier?: string } }
  const voices = await voicesResponse.json() as { voices?: unknown[] }
  const safeVoices = (voices.voices ?? []).flatMap((voice) => {
    if (!voice || typeof voice !== 'object') return []
    const candidate = voice as Record<string, unknown>
    if (typeof candidate.voice_id !== 'string' || typeof candidate.name !== 'string') return []
    return [{
      voice_id: candidate.voice_id,
      name: candidate.name,
      ...(typeof candidate.category === 'string' ? { category: candidate.category } : {}),
    } satisfies ElevenLabsVoice]
  })
  return { tier: user.subscription?.tier ?? 'unknown', voices: safeVoices }
}

export async function resolveElevenLabsTts(userId: string, language: Language) {
  const ownerId = process.env.ELEVENLABS_OWNER_USER_ID?.trim()
  if (ownerId && userId === ownerId) {
    const apiKey = process.env.ELEVENLABS_API_KEY?.trim()
    const config = getTtsLanguageConfig(language)
    if (!apiKey || !config) return null
    return { apiKey, config }
  }

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
