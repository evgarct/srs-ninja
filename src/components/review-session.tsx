'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitReview } from '@/lib/actions/cards'
import { Progress } from '@/components/ui/progress'
import { buttonVariants } from '@/lib/button-variants'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Flashcard } from '@/components/flashcard'
import { NoteEditSheet } from '@/components/note-edit-sheet'
import { Pencil } from 'lucide-react'
import type { Language, Rating } from '@/lib/types'
import {
  getReviewPrefetchAudioUrls,
  prepareReviewSessionCards,
  type ReviewSessionCard,
} from '@/lib/review-session'
import { applyReviewQueueOutcome } from '@/lib/review-loop'

export function ReviewSession({
  cards,
  deckId,
  language,
  audioMap = {},
}: {
  cards: ReviewSessionCard[]
  deckId: string
  language: string
  /** noteId → public audio URL, pre-fetched server-side */
  audioMap?: Record<string, string>
}) {
  const [queue, setQueue] = useState(cards)
  const [dynamicAudio, setDynamicAudio] = useState<Record<string, string>>({})
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(false)
  const [sessionStats, setSessionStats] = useState({ total: 0, correct: 0 })
  const [pendingReviewCount, setPendingReviewCount] = useState(0)
  const [syncError, setSyncError] = useState<string | null>(null)
  const startTimeRef = useRef<number>(0)
  const hasAutoPlayedRef = useRef(false)
  const warmedAudioRef = useRef(new Set<string>())
  const router = useRouter()

  const total = cards.length
  const lang = language as Language
  const resolvedAudioMap = useMemo(
    () => ({ ...audioMap, ...dynamicAudio }),
    [audioMap, dynamicAudio]
  )
  const preparedQueue = useMemo(
    () => prepareReviewSessionCards(queue, lang, resolvedAudioMap),
    [queue, lang, resolvedAudioMap]
  )
  const current = queue[0]
  const currentPrepared = preparedQueue[0]
  const completedReviews = sessionStats.total
  const projectedTotal = completedReviews + queue.length
  const progress = projectedTotal > 0
    ? Math.round((completedReviews / projectedTotal) * 100)
    : 0

  const isRecognition = currentPrepared?.direction === 'recognition'
  const audioUrl = currentPrepared?.audioUrl

  function handleSaveSuccess(updatedFields: Record<string, unknown>, newAudioUrl?: string) {
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

  useEffect(() => {
    if (typeof Audio === 'undefined') return

    const prefetchUrls = getReviewPrefetchAudioUrls(preparedQueue, 0, 2)

    for (const url of prefetchUrls) {
      if (warmedAudioRef.current.has(url)) continue

      const audio = new Audio()
      audio.preload = 'auto'
      audio.src = url
      audio.load()
      warmedAudioRef.current.add(url)
    }
  }, [preparedQueue])

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

  function handleRating(rating: Rating) {
    if (!current) return

    const currentCardId = current.id
    const durationMs = Date.now() - startTimeRef.current

    setSessionStats((s) => ({
      total: s.total + 1,
      correct: s.correct + (rating >= 3 ? 1 : 0),
    }))

    const nextQueue = applyReviewQueueOutcome(queue, rating)

    if (nextQueue.length === 0) {
      setDone(true)
    } else {
      setQueue(nextQueue)
      setRevealed(false)
      startTimeRef.current = Date.now()
    }

    setPendingReviewCount((count) => count + 1)
    void submitReview(currentCardId, rating, durationMs)
      .catch(() => {
        setSyncError('Часть результатов не сохранилась. Лучше обновить страницу и проверить историю review.')
      })
      .finally(() => {
        setPendingReviewCount((count) => Math.max(0, count - 1))
      })
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
        {pendingReviewCount > 0 && (
          <p className="text-sm text-muted-foreground mb-3">
            Сохраняем результаты… {pendingReviewCount}
          </p>
        )}
        {syncError && (
          <p className="text-sm text-destructive mb-3">
            {syncError}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          {pendingReviewCount > 0 ? (
            <Button variant="outline" disabled>
              Сохраняем…
            </Button>
          ) : (
            <Link href={`/decks/${deckId}/review`} className={buttonVariants({ variant: 'outline' })}>
              Review again
            </Link>
          )}
          <Button variant="outline" onClick={() => router.push('/')} disabled={pendingReviewCount > 0}>
            ← Home
          </Button>
        </div>
      </div>
    )
  }

  if (!current) return null

  const noteFields = currentPrepared?.noteFields ?? {}
  const flashcardProps = currentPrepared?.flashcardProps
  const intervals = currentPrepared?.intervals

  if (!flashcardProps || !intervals || !currentPrepared) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Progress value={progress} className="flex-1" />
        <span className="text-sm text-muted-foreground shrink-0 tabular-nums">
          {Math.min(completedReviews + 1, projectedTotal || total)} / {projectedTotal || total}
        </span>
      </div>

      <Flashcard
        {...flashcardProps}
        language={lang}
        direction={currentPrepared.direction}
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
