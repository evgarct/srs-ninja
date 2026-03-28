import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDraftBatches, getDraftNotes } from '@/lib/actions/drafts'
import { isOpenDraftConflict } from '@/lib/draft-import'
import { DraftReviewClient } from '@/components/draft-review-client'

type ConflictNoteRow = {
  id: string
  fields: Record<string, unknown>
  tags: string[]
}

export default async function DeckDraftsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ batchId?: string }>
}) {
  const { id } = await params
  const { batchId } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: deck } = await supabase
    .from('decks')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!deck) redirect('/')

  const [batches, notes] = await Promise.all([
    getDraftBatches(id),
    getDraftNotes({ deckId: id }),
  ])

  const conflictNoteIds = notes
    .filter((note) => isOpenDraftConflict(note.draft_conflict))
    .map((note) => note.draft_conflict!.matchedNoteId)

  const conflictNotesData = conflictNoteIds.length > 0
    ? (await supabase
        .from('notes')
        .select('id, fields, tags')
        .eq('deck_id', id)
        .in('id', conflictNoteIds)
        .eq('user_id', user.id)).data
    : []

  const conflictNotes = ((conflictNotesData ?? []) as ConflictNoteRow[]).map((note) => ({
    ...note,
    fields: note.fields ?? {},
    tags: note.tags ?? [],
  }))

  return (
    <DraftReviewClient
      deckId={id}
      deckName={deck.name}
      language={deck.language}
      initialBatches={batches}
      initialDraftNotes={notes}
      initialConflictNotes={conflictNotes}
      initialSelectedBatchId={batchId}
    />
  )
}
