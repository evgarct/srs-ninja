import type { Language } from '@/lib/types'

export type TtsLanguageConfig = {
  voiceId: string
  modelId: string
  languageCode: string
}

const ELEVENLABS_MODEL = 'eleven_flash_v2_5'

export const TTS_LANGUAGE_CONFIG: Record<Language, TtsLanguageConfig> = {
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

export function getTtsLanguageConfig(language: string): TtsLanguageConfig | null {
  return TTS_LANGUAGE_CONFIG[language as Language] ?? null
}

export function supportsTtsLanguage(language: string): language is Language {
  return getTtsLanguageConfig(language) !== null
}
