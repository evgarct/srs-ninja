import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'
import { defaultLocale, locales, type Locale } from './config'

function detectLocaleFromAcceptLanguage(acceptLanguage: string | null): Locale | null {
  if (!acceptLanguage) return null
  const preferred = acceptLanguage
    .split(',')
    .map((part) => part.split(';')[0].trim().toLowerCase().slice(0, 2))
  for (const lang of preferred) {
    if (locales.includes(lang as Locale)) return lang as Locale
  }
  return null
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const headerStore = await headers()

  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
  const browserLocale = detectLocaleFromAcceptLanguage(headerStore.get('accept-language'))

  const locale: Locale =
    (locales.includes(cookieLocale as Locale) ? (cookieLocale as Locale) : null) ??
    browserLocale ??
    defaultLocale

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
