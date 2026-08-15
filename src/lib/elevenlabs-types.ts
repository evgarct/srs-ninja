export const ELEVENLABS_LANGUAGES = ['english', 'czech', 'turkish'] as const

export type ElevenLabsLanguage = (typeof ELEVENLABS_LANGUAGES)[number]
export type ElevenLabsVoice = { voice_id: string; name: string; category?: string }
export type ElevenLabsVoiceSelections = Partial<Record<ElevenLabsLanguage, string | null>>

export function getUnavailableVoiceIds(
  selections: ElevenLabsVoiceSelections,
  voices: ElevenLabsVoice[]
) {
  const available = new Set(voices.map((voice) => voice.voice_id))
  return Object.values(selections).filter(
    (voiceId): voiceId is string => typeof voiceId === 'string' && voiceId.length > 0 && !available.has(voiceId)
  )
}
