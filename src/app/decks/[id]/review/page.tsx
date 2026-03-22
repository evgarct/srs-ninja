import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getDueCards } from '@/lib/actions/cards'
import { orderCards } from '@/lib/card-ordering'
import { ReviewSession } from '@/components/review-session'
import { ReviewSessionCompleteRestore } from '@/components/review-session-complete-restore'
import Link from 'next/link'
import { buttonVariants } from '@/lib/button-variants'
import { REGULAR_DUE_REVIEW_LIMIT } from '@/lib/review-config'

export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ completed?: string }>
}) {
  const { id: deckId } = await params
  const { completed } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: deck } = await supabase.from('decks').select('*').eq('id', deckId).single()
  if (!deck) redirect('/')

  const rawCards = await getDueCards(deckId, REGULAR_DUE_REVIEW_LIMIT)
  const cards = orderCards(rawCards)

  // Pre-fetch audio URLs for all cards (English deck only)
  let audioMap: Record<string, string> = {}
  if (deck.language === 'english' && cards.length > 0) {
    const noteIds = [...new Set(cards.map((c) => c.note_id))]
    const { data: audioRows } = await supabase
      .from('audio_cache')
      .select('note_id, storage_path')
      .in('note_id', noteIds)
      .eq('field_key', 'expression')

    if (audioRows) {
      audioMap = Object.fromEntries(audioRows.map((r) => [r.note_id, r.storage_path]))
    }
  }

  if (cards.length === 0) {
    if (completed === '1') {
      return (
        <main className="max-w-xl mx-auto px-4 py-8">
          <ReviewSessionCompleteRestore deckId={deckId} sessionMode="due" />
        </main>
      )
    }

    return (
      <main className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4">🎉</p>
        <h1 className="text-2xl font-bold mb-2">All done!</h1>
        <p className="text-muted-foreground mb-6">No cards due in «{deck.name}».</p>
        <Link href="/" className={buttonVariants()}>
          ← Home
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto flex h-[100svh] w-full flex-col overflow-hidden bg-[#f4f1ec] px-0 pb-0 pt-0 md:h-[calc(100svh-3.5rem)]">
      <ReviewSession cards={cards} deckId={deckId} language={deck.language} audioMap={audioMap} sessionMode="due" />
    </main>
  )
}
