export const locales = ['en', 'ru', 'cs'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'ru'

export const deckLanguageToLocale: Record<string, Locale> = {
  english: 'en',
  czech: 'cs',
}

export const localeToIntlLocale: Record<Locale, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  cs: 'cs-CZ',
}
