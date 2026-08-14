export const ELEVENLABS_LANGUAGES = ['english', 'czech', 'turkish'] as const

export type ElevenLabsLanguage = (typeof ELEVENLABS_LANGUAGES)[number]
export type ElevenLabsVoice = { voice_id: string; name: string; category?: string }
export type ElevenLabsVoiceSelections = Partial<Record<ElevenLabsLanguage, string | null>>
