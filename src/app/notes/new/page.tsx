import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { NoteForm } from '@/components/note-form'
import type { Language } from '@/lib/types'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getTranslations } from 'next-intl/server'
import { deckLanguageToLocale, type Locale } from '@/i18n/config'

export default async function NewNotePage({
  searchParams,
}: {
  searchParams: Promise<{ deckId?: string }>
}) {
  const { deckId } = await searchParams
  if (!deckId) redirect('/')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: deck } = await supabase.from('decks').select('*').eq('id', deckId).single()
  if (!deck) redirect('/')

  const appLocale = await getLocale() as Locale
  const deckLocale = deckLanguageToLocale[deck.language] ?? appLocale
  const messages = (await import(`../../../../messages/${deckLocale}.json`)).default
  const t = await getTranslations({ locale: deckLocale, namespace: 'noteForm' })

  return (
    <NextIntlClientProvider locale={deckLocale} messages={messages}>
      <main className="max-w-xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href={`/deck/${deckId}`} className="text-muted-foreground hover:text-foreground text-sm">
            ← {deck.name}
          </Link>
          <h1 className="text-2xl font-bold mt-2">{t('newTitle')}</h1>
        </div>
        <NoteForm deckId={deckId} language={deck.language as Language} />
      </main>
    </NextIntlClientProvider>
  )
}
