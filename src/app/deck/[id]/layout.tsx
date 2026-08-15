import { NextIntlClientProvider } from 'next-intl'
import { getLocale } from 'next-intl/server'
import { deckLanguageToLocale, type Locale } from '@/i18n/config'
import { getDeckById } from '@/lib/server/deck'

export default async function DeckLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const appLocale = await getLocale()

  const deck = await getDeckById(id)

  const deckLocale: Locale =
    deck ? (deckLanguageToLocale[deck.language] ?? (appLocale as Locale)) : (appLocale as Locale)

  const messages = (await import(`../../../../messages/${deckLocale}.json`)).default

  return (
    <NextIntlClientProvider locale={deckLocale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
