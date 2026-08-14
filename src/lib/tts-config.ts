import type { Language } from '@/lib/types'

export type TtsLanguageConfig = {
  voiceId: string
  modelId: string
  languageCode: string
}

const ELEVENLABS_MODEL = 'eleven_flash_v2_5'

export const TTS_LANGUAGE_CONFIG: Partial<Record<Language, TtsLanguageConfig>> = {
  english: {
    voiceId: 'JBFqnCBsd6RMkjVDRZzb',
    modelId: ELEVENLABS_MODEL,
    languageCode: 'en',
  },
  czech: {
    voiceId: 'TX3LPaxmHKxFdv7VOQHJ',
    modelId: ELEVENLABS_MODEL,
    languageCode: 'cs',
  },
}

export function getTtsLanguageConfig(language: string, voiceOverride?: string): TtsLanguageConfig | null {
  if (voiceOverride && supportsTtsLanguage(language)) {
    return { voiceId: voiceOverride, modelId: ELEVENLABS_MODEL, languageCode: { english: 'en', czech: 'cs', turkish: 'tr' }[language] }
  }
  if (language === 'turkish') {
    const voiceId = process.env.ELEVENLABS_TURKISH_VOICE_ID?.trim()
    if (!voiceId) return null
    return {
      voiceId,
      modelId: ELEVENLABS_MODEL,
      languageCode: 'tr',
    }
  }
  return TTS_LANGUAGE_CONFIG[language as Language] ?? null
}

export function supportsTtsLanguage(language: string): language is Language {
  return language === 'english' || language === 'czech' || language === 'turkish'
}
