import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getDueCards, getExtraStudyCards } from '@/lib/actions/cards'
import { ReviewSession } from '@/components/review-session'
import Link from 'next/link'
import { buttonVariants } from '@/lib/button-variants'

export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ deckId: string }>
  searchParams: Promise<{ mode?: string; limit?: string }>
}) {
  const { deckId } = await params
  const { mode, limit: limitStr } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: deck } = await supabase.from('decks').select('*').eq('id', deckId).single()
  if (!deck) redirect('/')

  const isExtra = mode === 'extra'
  const limit = Math.min(Math.max(parseInt(limitStr ?? '10', 10) || 10, 1), 50)

  const cards = isExtra
    ? await getExtraStudyCards(deckId, limit)
    : await getDueCards(deckId, 50)

  if (cards.length === 0) {
    return (
      <main className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4">{isExtra ? '📭' : '🎉'}</p>
        <h1 className="text-2xl font-bold mb-2">
          {isExtra ? 'Нет новых слов!' : 'Всё повторено!'}
        </h1>
        <p className="text-muted-foreground mb-6">
          {isExtra
            ? `В колоде «${deck.name}» нет новых карточек для изучения.`
            : `В колоде «${deck.name}» нет карточек для повторения.`}
        </p>
        <Link href={`/deck/${deckId}`} className={buttonVariants()}>
          ← К колоде
        </Link>
      </main>
    )
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link href={`/deck/${deckId}`} className="text-muted-foreground hover:text-foreground text-sm">
          ← {deck.name}
        </Link>
        <span className="text-sm text-muted-foreground">
          {isExtra ? '✨ Новые слова · ' : ''}{cards.length} карточек
        </span>
      </div>
      <ReviewSession cards={cards} deckId={deckId} language={deck.language} />
    </main>
  )
}
