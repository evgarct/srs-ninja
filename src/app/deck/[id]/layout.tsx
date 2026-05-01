import { NextIntlClientProvider } from 'next-intl'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { deckLanguageToLocale, type Locale } from '@/i18n/config'

export default async function DeckLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const appLocale = await getLocale()

  const supabase = await createClient()
  const { data: deck } = await supabase.from('decks').select('language').eq('id', id).single()

  const deckLocale: Locale =
    deck ? (deckLanguageToLocale[deck.language] ?? (appLocale as Locale)) : (appLocale as Locale)

  const messages = (await import(`../../../../messages/${deckLocale}.json`)).default

  return (
    <NextIntlClientProvider locale={deckLocale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
