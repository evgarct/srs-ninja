import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getDeckWithStats } from '@/lib/actions/decks'
import { getNotesByDeck } from '@/lib/actions/notes'
import { DeckPageClient } from '@/components/deck-page-client'

export default async function DeckPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ filter?: string }>
}) {
  const { id } = await params
  const { filter } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ deck, dueCards, totalCards, totalNotes }, notes] = await Promise.all([
    getDeckWithStats(id),
    getNotesByDeck(id),
  ])

  if (!deck) redirect('/')

  // Fetch audio URLs for notes (expression field only)
  const noteIds = notes.map((n) => n.id)
  const { data: audioRows } = noteIds.length > 0
    ? await supabase
        .from('audio_cache')
        .select('note_id, storage_path')
        .in('note_id', noteIds)
        .eq('field_key', 'expression')
    : { data: [] }

  return (
    <DeckPageClient
      deckId={id}
      deckName={deck.name}
      deckLanguage={deck.language}
      dueCards={dueCards}
      totalCards={totalCards}
      totalNotes={totalNotes}
      initialNotes={notes.map((note) => ({
        id: note.id,
        fields: note.fields as Record<string, string>,
        cards: (note.cards as Array<{ id: string; card_type: string; state: string }>) ?? [],
      }))}
      initialAudioMap={Object.fromEntries(
        (audioRows ?? []).map((row) => [row.note_id, row.storage_path])
      )}
      initialFilter={filter}
    />
  )
}
