import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getDueCards, getExtraStudyCards, getManualStudyCards } from '@/lib/actions/cards'
import { orderCards } from '@/lib/card-ordering'
import { ReviewSession } from '@/components/review-session'
import { ReviewSessionCompleteRestore } from '@/components/review-session-complete-restore'
import Link from 'next/link'
import { buttonVariants } from '@/lib/button-variants'
import { isFsrsState, normalizeAudioFilter, type AudioFilter, type FsrsState } from '@/lib/deck-notes'
import { selectReviewSessionCards } from '@/lib/review-card-selection'
import { REGULAR_DUE_REVIEW_LIMIT } from '@/lib/review-config'

export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ deckId: string }>
  searchParams: Promise<{ mode?: string; limit?: string; tags?: string; state?: string; audio?: string; completed?: string }>
}) {
  const { deckId } = await params
  const { mode, limit: limitStr, tags: tagsParam, state: stateParam, audio: audioParam, completed } =
    await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: deck } = await supabase.from('decks').select('*').eq('id', deckId).single()
  if (!deck) redirect('/')

  const isExtra = mode === 'extra'
  const isManual = mode === 'manual'
  const isCompleted = completed === '1'
  const limit = Math.min(Math.max(parseInt(limitStr ?? '10', 10) || 10, 1), 50)
  const manualTags = (tagsParam ?? '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
  const manualStates = (stateParam ?? '')
    .split(',')
    .map((state) => state.trim())
    .filter(isFsrsState) as FsrsState[]
  const manualAudioFilter: AudioFilter = normalizeAudioFilter(audioParam)

  const rawCards = isManual
    ? await getManualStudyCards(deckId, {
        tags: manualTags,
        states: manualStates,
        audioFilter: manualAudioFilter,
      })
    : isExtra
      ? await getExtraStudyCards(deckId, limit)
      : await getDueCards(deckId, REGULAR_DUE_REVIEW_LIMIT)

  // Apply due-review ordering only to the regular queue.
  // Manual review must preserve the full shown subset, and extra study keeps its own order.
  const cards = selectReviewSessionCards(rawCards, {
    isExtra,
    isManual,
    orderCards,
  })

  // Pre-fetch audio URLs for English decks
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
    if (isCompleted) {
      return (
        <main className="max-w-xl mx-auto px-4 py-8">
          <ReviewSessionCompleteRestore
            deckId={deckId}
            sessionMode={isExtra ? 'extra' : isManual ? 'manual' : 'due'}
          />
        </main>
      )
    }

    return (
      <main className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4">{isExtra ? '📭' : '🎉'}</p>
        <h1 className="text-2xl font-bold mb-2">
          {isExtra ? 'Нет новых слов!' : isManual ? 'Нет карточек по фильтру' : 'Всё повторено!'}
        </h1>
        <p className="text-muted-foreground mb-6">
          {isExtra
            ? `В колоде «${deck.name}» нет новых карточек для изучения.`
            : isManual
              ? `Фильтрованный набор в колоде «${deck.name}» сейчас пуст.`
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
          {isExtra ? '✨ Новые слова · ' : isManual ? '🧪 Ручная тренировка · ' : ''}{cards.length} карточек
        </span>
      </div>
      <ReviewSession
        cards={cards}
        deckId={deckId}
        language={deck.language}
        audioMap={audioMap}
        sessionMode={isExtra ? 'extra' : isManual ? 'manual' : 'due'}
      />
    </main>
  )
}
