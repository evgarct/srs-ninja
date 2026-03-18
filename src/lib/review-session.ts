import { getSchedulingIntervals } from '@/lib/fsrs'
import { mapFieldsToFlashcard } from '@/lib/flashcard-mapping'
import type { Card, Language } from '@/lib/types'

export interface ReviewSessionCard extends Pick<Card,
  'id' | 'note_id' | 'card_type' | 'state' | 'stability' | 'difficulty' |
  'elapsed_days' | 'scheduled_days' | 'reps' | 'lapses' | 'due_at' | 'last_review'
> {
  notes: {
    fields: Record<string, unknown>
    tags: string[]
    deck_id: string
  } | null
}

export interface PreparedReviewSessionCard {
  id: string
  noteId: string
  direction: 'recognition' | 'production'
  noteFields: Record<string, unknown>
  flashcardProps: ReturnType<typeof mapFieldsToFlashcard>
  intervals: {
    again: string
    hard: string
    good: string
    easy: string
  }
  audioUrl?: string
}

export function formatReviewInterval(days: number): string {
  if (days < 1 / 24 / 60) return '<1m'
  if (days < 1 / 24) return `${Math.round(days * 24 * 60)}m`
  if (days < 1) return `${Math.round(days * 24)}h`
  if (days < 30) return `${Math.round(days)}d`
  if (days < 365) return `${Math.round(days / 30)}mo`
  return `${Math.round(days / 365)}y`
}

export function prepareReviewSessionCards(
  cards: ReviewSessionCard[],
  language: Language,
  audioMap: Record<string, string>,
  now = new Date()
): PreparedReviewSessionCard[] {
  return cards.map((card) => {
    const noteFields = card.notes?.fields ?? {}
    const intervalDays = getSchedulingIntervals(card as unknown as Card, now)

    return {
      id: card.id,
      noteId: card.note_id,
      direction: card.card_type === 'recognition' ? 'recognition' : 'production',
      noteFields,
      flashcardProps: mapFieldsToFlashcard(noteFields, language),
      intervals: {
        again: formatReviewInterval(intervalDays.again),
        hard: formatReviewInterval(intervalDays.hard),
        good: formatReviewInterval(intervalDays.good),
        easy: formatReviewInterval(intervalDays.easy),
      },
      audioUrl: audioMap[card.note_id] ?? undefined,
    }
  })
}

export function getReviewPrefetchAudioUrls(
  cards: PreparedReviewSessionCard[],
  index: number,
  lookahead = 2
) {
  const start = Math.max(0, index)
  const end = Math.min(cards.length, start + lookahead + 1)

  return [...new Set(
    cards
      .slice(start, end)
      .map((card) => card.audioUrl)
      .filter((audioUrl): audioUrl is string => Boolean(audioUrl))
  )]
}
