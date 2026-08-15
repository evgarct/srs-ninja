export const ELEVENLABS_LANGUAGES = ['english', 'czech', 'turkish'] as const

export type ElevenLabsLanguage = (typeof ELEVENLABS_LANGUAGES)[number]
export type ElevenLabsVerifiedLanguage = {
  language: string
  model_id?: string
  accent?: string
  locale?: string
}
export type ElevenLabsVoice = {
  voice_id: string
  name: string
  category?: string
  labels: Record<string, string>
  preview_url?: string
  available_for_tiers: string[]
  verified_languages: ElevenLabsVerifiedLanguage[]
}
export type ElevenLabsVoiceSelections = Partial<Record<ElevenLabsLanguage, string | null>>

const LANGUAGE_CODES: Record<ElevenLabsLanguage, string> = {
  english: 'en',
  czech: 'cs',
  turkish: 'tr',
}

export function voiceIsVerifiedForLanguage(voice: ElevenLabsVoice, language: ElevenLabsLanguage) {
  return voice.verified_languages.some(({ language: code, locale }) =>
    code.toLowerCase() === LANGUAGE_CODES[language] || locale?.toLowerCase().startsWith(`${LANGUAGE_CODES[language]}-`)
  )
}

export function groupVoicesForLanguage(voices: ElevenLabsVoice[], language: ElevenLabsLanguage) {
  return voices.reduce<{ verified: ElevenLabsVoice[]; other: ElevenLabsVoice[] }>((groups, voice) => {
    groups[voiceIsVerifiedForLanguage(voice, language) ? 'verified' : 'other'].push(voice)
    return groups
  }, { verified: [], other: [] })
}

export function getUnavailableVoiceIds(
  selections: ElevenLabsVoiceSelections,
  voices: ElevenLabsVoice[]
) {
  const available = new Set(voices.map((voice) => voice.voice_id))
  return Object.values(selections).filter(
    (voiceId): voiceId is string => typeof voiceId === 'string' && voiceId.length > 0 && !available.has(voiceId)
  )
}
