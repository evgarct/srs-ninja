'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { submitReview } from '@/lib/actions/cards'
import { getSchedulingIntervals } from '@/lib/fsrs'
import { Progress } from '@/components/ui/progress'
import { buttonVariants } from '@/lib/button-variants'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Flashcard } from '@/components/flashcard'
import type { Language, Rating, CEFRLevel, Card } from '@/lib/types'

interface ReviewCard extends Pick<Card,
  'id' | 'card_type' | 'state' | 'stability' | 'difficulty' |
  'elapsed_days' | 'scheduled_days' | 'reps' | 'lapses' | 'due_at' | 'last_review'
> {
  notes: {
    fields: Record<string, unknown>
    tags: string[]
    deck_id: string
  } | null
}

/**
 * Formats a scheduled_days number into a short human-readable string.
 * e.g. 0.007 → "<1m", 0.04 → "1h", 1.5 → "2d", 45 → "2mo", 400 → "1y"
 */
function formatInterval(days: number): string {
  if (days < 1 / 24 / 60) return '<1m'
  if (days < 1 / 24) return `${Math.round(days * 24 * 60)}m`
  if (days < 1) return `${Math.round(days * 24)}h`
  if (days < 30) return `${Math.round(days)}d`
  if (days < 365) return `${Math.round(days / 30)}mo`
  return `${Math.round(days / 365)}y`
}

/**
 * Maps raw note fields from the DB to props for the Flashcard component.
 * Handles the JSONB field names as stored in Supabase (expression, translation,
 * examples[], level, part_of_speech, frequency, style, note, synonyms[], antonyms[]).
 */
function mapFieldsToFlashcard(
  fields: Record<string, unknown>,
  language: Language
) {
  const expression = String(fields.expression ?? '—')
  const translation = String(fields.translation ?? '—')

  // examples is already a string[] with <b> tags from the DB
  const examples: string[] = Array.isArray(fields.examples)
    ? (fields.examples as unknown[]).map(String)
    : []

  // Parse CEFR level — default to B1 if missing/invalid
  const validLevels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  const rawLevel = String(fields.level ?? '')
  const level: CEFRLevel = validLevels.includes(rawLevel as CEFRLevel)
    ? (rawLevel as CEFRLevel)
    : 'B1'

  // Frequency: DB stores 1-10 directly
  const frequency = Math.min(10, Math.max(1, Math.round(Number(fields.frequency ?? 5))))

  // Style: DB stores the full string including emoji (e.g. "🧠 Formal / Common in...")
  const style = String(fields.style ?? '')

  const partOfSpeech = String(fields.part_of_speech ?? '')
  const gender = language === 'czech' ? (fields.gender ? String(fields.gender) : undefined) : undefined
  const note = fields.note ? String(fields.note) : undefined
  const imageUrl = fields.image_url ? String(fields.image_url) : undefined

  const synonyms = Array.isArray(fields.synonyms)
    ? (fields.synonyms as unknown[]).map(String)
    : undefined
  const antonyms = Array.isArray(fields.antonyms)
    ? (fields.antonyms as unknown[]).map(String)
    : undefined

  return {
    expression,
    translation,
    examples,
    level,
    partOfSpeech,
    gender,
    frequency,
    style,
    note,
    imageUrl,
    synonyms,
    antonyms,
  }
}

/**
 * The main interactive component for studying flashcards (Spaced Repetition Review).
 *
 * Manages the review queue, calls submitReview server action on each rating,
 * and shows a completion summary. Uses the Flashcard component for the UI.
 */
export function ReviewSession({
  cards,
  deckId,
  language,
}: {
  cards: ReviewCard[]
  deckId: string
  language: string
}) {
  const [queue] = useState(cards)
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(false)
  const [sessionStats, setSessionStats] = useState({ total: 0, correct: 0 })
  const startTimeRef = useRef(Date.now())
  const router = useRouter()

  const total = cards.length
  const current = queue[index]
  const progress = total > 0 ? Math.round((index / total) * 100) : 0

  async function handleRating(rating: Rating) {
    const durationMs = Date.now() - startTimeRef.current
    await submitReview(current.id, rating, durationMs)

    setSessionStats((s) => ({
      total: s.total + 1,
      correct: s.correct + (rating >= 3 ? 1 : 0),
    }))

    const nextIndex = index + 1
    if (nextIndex >= queue.length) {
      setDone(true)
    } else {
      setIndex(nextIndex)
      setRevealed(false)
      startTimeRef.current = Date.now()
    }
  }

  // ── Session complete screen ──────────────────────────────────────────────
  if (done) {
    const accuracy =
      sessionStats.total > 0
        ? Math.round((sessionStats.correct / sessionStats.total) * 100)
        : 0
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-4">🎉</p>
        <h2 className="text-2xl font-bold mb-2">Done for today!</h2>
        <p className="text-muted-foreground mb-6">
          {sessionStats.total} cards · {accuracy}% accuracy
        </p>
        <div className="flex gap-3 justify-center">
          <Link href={`/decks/${deckId}/review`} className={buttonVariants({ variant: 'outline' })}>
            Review again
          </Link>
          <Button variant="outline" onClick={() => router.push('/')}>
            ← Home
          </Button>
        </div>
      </div>
    )
  }

  if (!current) return null

  const noteFields = current.notes?.fields ?? {}
  const isRecognition = current.card_type === 'recognition'
  const lang = language as Language

  const flashcardProps = mapFieldsToFlashcard(noteFields, lang)

  // Calculate FSRS interval labels for the 4 rating buttons
  const intervalDays = getSchedulingIntervals(current as unknown as import('@/lib/types').Card)
  const intervals = {
    again: formatInterval(intervalDays.again),
    hard: formatInterval(intervalDays.hard),
    good: formatInterval(intervalDays.good),
    easy: formatInterval(intervalDays.easy),
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <Progress value={progress} className="flex-1" />
        <span className="text-sm text-muted-foreground shrink-0 tabular-nums">
          {index + 1} / {total}
        </span>
      </div>

      {/* Flashcard */}
      <Flashcard
        {...flashcardProps}
        language={lang}
        direction={isRecognition ? 'recognition' : 'production'}
        isRevealed={revealed}
        intervals={intervals}
        onReveal={() => {
          setRevealed(true)
          startTimeRef.current = Date.now()
        }}
        onRate={handleRating}
      />
    </div>
  )
}
