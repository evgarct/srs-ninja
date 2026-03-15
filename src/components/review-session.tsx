'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { submitReview } from '@/lib/actions/cards'
import { Progress } from '@/components/ui/progress'
import { buttonVariants } from '@/lib/button-variants'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Flashcard } from '@/components/flashcard'
import { STYLE_EMOJI } from '@/lib/types'
import type { Language, Rating, CEFRLevel } from '@/lib/types'

interface ReviewCard {
  id: string
  card_type: string
  state: string
  notes: {
    fields: Record<string, string>
    tags: string[]
    deck_id: string
  } | null
}

/**
 * Maps raw note fields from the DB to props for the Flashcard component.
 * This handles field name differences, data type conversions, and
 * the construction of example sentences with <b> highlighting.
 */
function mapFieldsToFlashcard(
  fields: Record<string, string>,
  language: Language
) {
  const expression = fields.word || '—'
  const translation = fields.translation || '—'

  // Build example sentences — highlight the target word with <b> tags
  const examples: string[] = []
  if (fields.example_sentence) {
    // Wrap occurrences of the target word in <b> tags (case-insensitive)
    const highlighted = fields.example_sentence.replace(
      new RegExp(`(${expression.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
      '<b>$1</b>'
    )
    examples.push(highlighted)
  }
  if (fields.example_translation) {
    examples.push(fields.example_translation)
  }

  // Parse CEFR level — default to B1 if missing/invalid
  const validLevels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  const level: CEFRLevel = validLevels.includes(fields.level as CEFRLevel)
    ? (fields.level as CEFRLevel)
    : 'B1'

  // Frequency: DB stores 1-5, component expects 1-10
  const rawFreq = parseInt(fields.frequency ?? '3', 10)
  const frequency = Math.round(((rawFreq - 1) / 4) * 9) + 1 // map 1-5 → 1-10

  // Style: add emoji prefix
  const styleKey = fields.style || 'neutral'
  const emoji = STYLE_EMOJI[styleKey] ?? '🎓'
  const style = `${emoji} ${styleKey.charAt(0).toUpperCase() + styleKey.slice(1)}`

  const partOfSpeech = fields.part_of_speech || ''
  const gender = language === 'czech' ? fields.gender || undefined : undefined
  const note = language === 'czech' ? fields.notes || undefined : undefined
  const imageUrl = fields.image_url || undefined

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
  const progress = total > 0 ? Math.round(((index) / total) * 100) : 0

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
        <h2 className="text-2xl font-bold mb-2">Сессия завершена!</h2>
        <p className="text-muted-foreground mb-6">
          {sessionStats.total} карточек · {accuracy}% точность
        </p>
        <div className="flex gap-3 justify-center">
          <Link href={`/deck/${deckId}`} className={buttonVariants()}>
            ← К колоде
          </Link>
          <Button variant="outline" onClick={() => router.refresh()}>
            Продолжить
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
        onReveal={() => {
          setRevealed(true)
          startTimeRef.current = Date.now()
        }}
        onRate={handleRating}
      />
    </div>
  )
}
