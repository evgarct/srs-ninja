import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getNote } from '@/lib/actions/notes'
import { NoteForm } from '@/components/note-form'
import type { Language } from '@/lib/types'

export default async function EditNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const note = await getNote(id)
  if (!note) redirect('/')

  const { data: deck } = await supabase.from('decks').select('*').eq('id', note.deck_id).single()
  if (!deck) redirect('/')

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/deck/${deck.id}`} className="text-muted-foreground hover:text-foreground text-sm">
          ← {deck.name}
        </Link>
        <h1 className="text-2xl font-bold mt-2">Редактировать нот</h1>
      </div>
      <NoteForm
        deckId={deck.id}
        language={deck.language as Language}
        noteId={id}
        initialFields={note.fields as Record<string, string>}
        initialTags={note.tags ?? []}
      />
    </main>
  )
}
