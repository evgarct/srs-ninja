import type { Language } from '@/lib/types'

export type TtsLanguageConfig = {
  voiceId: string
  modelId: string
  languageCode: string
}

const ELEVENLABS_MODEL = 'eleven_flash_v2_5'
const LANGUAGE_CODES: Record<Language, string> = { english: 'en', czech: 'cs', turkish: 'tr' }

export function getTtsLanguageConfig(language: string, voiceOverride?: string): TtsLanguageConfig | null {
  if (!voiceOverride || !supportsTtsLanguage(language)) return null
  return { voiceId: voiceOverride, modelId: ELEVENLABS_MODEL, languageCode: LANGUAGE_CODES[language] }
}

export function supportsTtsLanguage(language: string): language is Language {
  return language === 'english' || language === 'czech' || language === 'turkish'
}
