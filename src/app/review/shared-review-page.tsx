import Link from 'next/link'
import { redirect } from 'next/navigation'

import { ReviewSession } from '@/components/review-session'
import { ReviewSessionCompleteRestore } from '@/components/review-session-complete-restore'
import { getDueCards, getExtraStudyCards, getManualStudyCards } from '@/lib/actions/cards'
import { buttonVariants } from '@/lib/button-variants'
import { orderCards } from '@/lib/card-ordering'
import { selectReviewSessionCards } from '@/lib/review-card-selection'
import { REGULAR_DUE_REVIEW_LIMIT } from '@/lib/review-config'
import { parseReviewSessionSearchParams, type ReviewSessionSearchParams } from '@/lib/review-session-route'
import { createClient } from '@/lib/supabase/server'
import { supportsTtsLanguage } from '@/lib/tts-config'

function getEmptyStateCopy(
  sessionMode: 'due' | 'manual' | 'extra',
  deckName: string
) {
  if (sessionMode === 'extra') {
    return {
      emoji: '📭',
      title: 'Нет новых слов!',
      body: `В колоде «${deckName}» нет новых карточек для изучения.`,
    }
  }

  if (sessionMode === 'manual') {
    return {
      emoji: '🎯',
      title: 'Нет карточек по фильтру',
      body: `Фильтрованный набор в колоде «${deckName}» сейчас пуст.`,
    }
  }

  return {
    emoji: '🎉',
    title: 'Всё повторено!',
    body: `В колоде «${deckName}» нет карточек для повторения.`,
  }
}

export async function renderSharedReviewPage(
  deckId: string,
  searchParams: ReviewSessionSearchParams
) {
  const {
    sessionMode,
    isCompleted,
    limit,
    manualTags,
    manualStates,
    manualAudioFilter,
  } = parseReviewSessionSearchParams(searchParams)
  const isExtra = sessionMode === 'extra'
  const isManual = sessionMode === 'manual'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: deck } = await supabase.from('decks').select('*').eq('id', deckId).single()
  if (!deck) redirect('/')

  const rawCards = isManual
    ? await getManualStudyCards(deckId, {
        tags: manualTags,
        states: manualStates,
        audioFilter: manualAudioFilter,
      })
    : isExtra
      ? await getExtraStudyCards(deckId, limit)
      : await getDueCards(deckId, REGULAR_DUE_REVIEW_LIMIT)

  const cards = selectReviewSessionCards(rawCards, {
    isExtra,
    isManual,
    orderCards,
    sessionLimit: isExtra || isManual ? undefined : REGULAR_DUE_REVIEW_LIMIT,
  })

  let audioMap: Record<string, string> = {}
  if (supportsTtsLanguage(deck.language) && cards.length > 0) {
    const noteIds = [...new Set(cards.map((card) => card.note_id))]
    const { data: audioRows } = await supabase
      .from('audio_cache')
      .select('note_id, storage_path')
      .in('note_id', noteIds)
      .eq('field_key', 'expression')

    if (audioRows) {
      audioMap = Object.fromEntries(audioRows.map((row) => [row.note_id, row.storage_path]))
    }
  }

  if (cards.length === 0) {
    if (isCompleted) {
      return (
        <main className="max-w-xl mx-auto px-4 py-8">
          <ReviewSessionCompleteRestore deckId={deckId} sessionMode={sessionMode} />
        </main>
      )
    }

    const emptyStateCopy = getEmptyStateCopy(sessionMode, deck.name)

    return (
      <main className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4">{emptyStateCopy.emoji}</p>
        <h1 className="text-2xl font-bold mb-2">{emptyStateCopy.title}</h1>
        <p className="text-muted-foreground mb-6">{emptyStateCopy.body}</p>
        <Link href={`/deck/${deckId}`} className={buttonVariants()}>
          ← К колоде
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto flex h-[100svh] w-full flex-col overflow-hidden bg-[#090511] px-0 pb-0 pt-0 md:h-[calc(100svh-3.5rem)]">
      <ReviewSession
        cards={cards}
        deckId={deckId}
        language={deck.language}
        audioMap={audioMap}
        sessionMode={sessionMode}
      />
    </main>
  )
}
