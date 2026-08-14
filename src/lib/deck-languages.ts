import type { Language, TranslationLanguage } from '@/lib/types'

export const DECK_LANGUAGES = ['czech', 'english', 'turkish'] as const satisfies readonly Language[]
export const TRANSLATION_LANGUAGES = [
  'russian',
  'english',
  'czech',
  'turkish',
] as const satisfies readonly TranslationLanguage[]

export function isLanguage(value: string): value is Language {
  return DECK_LANGUAGES.includes(value as Language)
}

export function isTranslationLanguage(value: string): value is TranslationLanguage {
  return TRANSLATION_LANGUAGES.includes(value as TranslationLanguage)
}

export function isValidLanguagePair(
  language: Language,
  translationLanguage: TranslationLanguage
) {
  return language !== translationLanguage
}

export function assertValidLanguagePair(
  language: string,
  translationLanguage: string
): asserts language is Language {
  if (!isLanguage(language)) throw new Error('Unsupported deck language')
  if (!isTranslationLanguage(translationLanguage)) throw new Error('Unsupported translation language')
  if (!isValidLanguagePair(language, translationLanguage)) {
    throw new Error('Deck and translation languages must be different')
  }
}

export function getAvailableTranslationLanguages(language: Language) {
  return TRANSLATION_LANGUAGES.filter((candidate) => candidate !== language)
}
