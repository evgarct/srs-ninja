import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getDueCards } from '@/lib/actions/cards'
import { ReviewSession } from '@/components/review-session'
import Link from 'next/link'
import { buttonVariants } from '@/lib/button-variants'

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: deckId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: deck } = await supabase.from('decks').select('*').eq('id', deckId).single()
  if (!deck) redirect('/')

  const cards = await getDueCards(deckId, 50)

  if (cards.length === 0) {
    return (
      <main className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4">🎉</p>
        <h1 className="text-2xl font-bold mb-2">All done!</h1>
        <p className="text-muted-foreground mb-6">
          No cards due in «{deck.name}».
        </p>
        <Link href="/" className={buttonVariants()}>
          ← Home
        </Link>
      </main>
    )
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="text-muted-foreground hover:text-foreground text-sm">
          ← Home
        </Link>
        <span className="text-sm text-muted-foreground">
          {deck.name} · {cards.length} cards
        </span>
      </div>
      <ReviewSession cards={cards} deckId={deckId} language={deck.language} />
    </main>
  )
}
