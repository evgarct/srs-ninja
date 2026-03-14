import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getDecks } from '@/lib/actions/decks'
import { AnkiImporter } from '@/components/anki-importer'

export default async function ImportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const decks = await getDecks()

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Импорт из Anki</h1>
      <p className="text-muted-foreground mb-8">
        Загрузите файл .apkg для импорта карточек в существующую колоду.
      </p>
      <AnkiImporter decks={decks} />
    </main>
  )
}
