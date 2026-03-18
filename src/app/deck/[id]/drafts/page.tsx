import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDraftBatches, getDraftNotes } from '@/lib/actions/drafts'
import { DraftReviewClient } from '@/components/draft-review-client'

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

  return (
    <DraftReviewClient
      deckId={id}
      deckName={deck.name}
      language={deck.language}
      initialBatches={batches}
      initialDraftNotes={notes}
      initialSelectedBatchId={batchId}
    />
  )
}
