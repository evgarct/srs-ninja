'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { submitReview } from '@/lib/actions/cards'
import { getSchedulingIntervals } from '@/lib/fsrs'
import { Progress } from '@/components/ui/progress'
import { buttonVariants } from '@/lib/button-variants'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Flashcard } from '@/components/flashcard'
import { NoteEditSheet } from '@/components/note-edit-sheet'
import { Pencil } from 'lucide-react'
import type { Language, Rating, CEFRLevel, Card } from '@/lib/types'
import { getNotePrimaryText } from '@/lib/note-fields'

interface ReviewCard extends Pick<Card,
  'id' | 'note_id' | 'card_type' | 'state' | 'stability' | 'difficulty' |
  'elapsed_days' | 'scheduled_days' | 'reps' | 'lapses' | 'due_at' | 'last_review'
> {
  notes: {
    fields: Record<string, unknown>
    tags: string[]
    deck_id: string
  } | null
}

function formatInterval(days: number): string {
  if (days < 1 / 24 / 60) return '<1m'
  if (days < 1 / 24) return `${Math.round(days * 24 * 60)}m`
  if (days < 1) return `${Math.round(days * 24)}h`
  if (days < 30) return `${Math.round(days)}d`
  if (days < 365) return `${Math.round(days / 30)}mo`
  return `${Math.round(days / 365)}y`
}

function mapFieldsToFlashcard(
  fields: Record<string, unknown>,
  language: Language
) {
  const expression = getNotePrimaryText(fields) || '—'
  const translation = String(fields.translation ?? '—')

  const examples: string[] = Array.isArray(fields.examples)
    ? (fields.examples as unknown[]).map(String)
    : []

  const validLevels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  const rawLevel = String(fields.level ?? '')
  const level: CEFRLevel = validLevels.includes(rawLevel as CEFRLevel)
    ? (rawLevel as CEFRLevel)
    : 'B1'

  const frequency = Math.min(10, Math.max(1, Math.round(Number(fields.frequency ?? 5))))
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

export function ReviewSession({
  cards,
  deckId,
  language,
  audioMap = {},
}: {
  cards: ReviewCard[]
  deckId: string
  language: string
  /** noteId → public audio URL, pre-fetched server-side */
  audioMap?: Record<string, string>
}) {
  const [queue, setQueue] = useState(cards)
  const [dynamicAudio, setDynamicAudio] = useState<Record<string, string>>({})
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(false)
  const [sessionStats, setSessionStats] = useState({ total: 0, correct: 0 })
  const startTimeRef = useRef<number>(0)
  const hasAutoPlayedRef = useRef(false)
  const router = useRouter()

  const total = cards.length
  const current = queue[index]
  const progress = total > 0 ? Math.round((index / total) * 100) : 0

  const isRecognition = current?.card_type === 'recognition'
  const lang = language as Language
  const audioUrl = current ? (dynamicAudio[current.note_id] ?? audioMap[current.note_id] ?? undefined) : undefined

  function handleSaveSuccess(updatedFields: Record<string, string>, newAudioUrl?: string) {
    const currentNoteId = current?.note_id

    setQueue((prev) => {
      if (!currentNoteId) return prev

      return prev.map((card) => {
        if (card.note_id !== currentNoteId || !card.notes) return card

        return {
          ...card,
          notes: {
            ...card.notes,
            fields: updatedFields,
          },
        }
      })
    })

    if (newAudioUrl && currentNoteId) {
      setDynamicAudio((prev) => ({
        ...prev,
        [currentNoteId]: newAudioUrl,
      }))
    }
  }

  // Reset autoplay flag when the card changes
  useEffect(() => {
    hasAutoPlayedRef.current = false
  }, [current?.id])

  useEffect(() => {
    startTimeRef.current = Date.now()
  }, [])

  // Autoplay logic:
  // - Recognition front: play when card first appears
  // - Production back: play when answer is revealed
  // - Production front (Russian): no autoplay
  useEffect(() => {
    if (hasAutoPlayedRef.current || !audioUrl) return

    const shouldAutoPlay =
      (isRecognition && !revealed) ||
      (!isRecognition && revealed)

    if (shouldAutoPlay) {
      const audioEl = new Audio(audioUrl)
      audioEl.play().catch(() => {}) // gracefully handle browser autoplay restrictions
      hasAutoPlayedRef.current = true
    }
  }, [isRecognition, revealed, audioUrl])

  function playAudio() {
    if (audioUrl) {
      new Audio(audioUrl).play().catch(() => {})
    }
  }

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

  // ── Session complete ─────────────────────────────────────────────────────
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
  const flashcardProps = mapFieldsToFlashcard(noteFields, lang)

  const intervalDays = getSchedulingIntervals(current as unknown as Card)
  const intervals = {
    again: formatInterval(intervalDays.again),
    hard: formatInterval(intervalDays.hard),
    good: formatInterval(intervalDays.good),
    easy: formatInterval(intervalDays.easy),
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Progress value={progress} className="flex-1" />
        <span className="text-sm text-muted-foreground shrink-0 tabular-nums">
          {index + 1} / {total}
        </span>
      </div>

      <Flashcard
        {...flashcardProps}
        language={lang}
        direction={isRecognition ? 'recognition' : 'production'}
        isRevealed={revealed}
        intervals={intervals}
        audioUrl={audioUrl}
        onPlayAudio={audioUrl ? playAudio : undefined}
        onReveal={() => {
          setRevealed(true)
          startTimeRef.current = Date.now()
        }}
        onRate={handleRating}
        headerAction={
          <NoteEditSheet
            noteId={current.note_id}
            deckId={deckId}
            language={lang}
            initialFields={noteFields as Record<string, string>}
            onSaveSuccess={handleSaveSuccess}
            trigger={
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors" title="Edit Note">
                <Pencil className="w-4 h-4" />
              </Button>
            }
          />
        }
      />
    </div>
  )
}
