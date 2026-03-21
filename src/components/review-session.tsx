'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useReducedMotion } from 'motion/react'
import { submitReview } from '@/lib/actions/cards'
import { Button } from '@/components/ui/button'
import { Ripple } from '@/components/ui/ripple'
import { AnimatedCircularProgressBar } from '@/components/ui/animated-circular-progress-bar'
import { Confetti, type ConfettiRef } from '@/components/ui/confetti'
import { Flashcard } from '@/components/flashcard'
import { NoteEditSheet } from '@/components/note-edit-sheet'
import { ReviewFeedbackDock } from '@/components/review-feedback-dock'
import { Pencil } from 'lucide-react'
import type { Language, Rating } from '@/lib/types'
import {
  getReviewPrefetchAudioUrls,
  prepareReviewSessionCards,
  type ReviewSessionCard,
} from '@/lib/review-session'
import { applyReviewQueueOutcome } from '@/lib/review-loop'
import { markReviewSessionCompleted } from '@/lib/actions/decks'
import { ReviewSessionComplete, type ReviewSessionStats } from '@/components/review-session-complete'
import {
  clearReviewSessionCompletionState,
  persistCompletionUrl,
  saveReviewSessionCompletionState,
} from '@/lib/review-session-completion-state'
import { ReactBitsReviewStack } from '@/components/reactbits-review-stack'

export function ReviewSession({
  cards,
  deckId,
  language,
  audioMap = {},
  sessionMode = 'due',
}: {
  cards: ReviewSessionCard[]
  deckId: string
  language: string
  /** noteId → public audio URL, pre-fetched server-side */
  audioMap?: Record<string, string>
  sessionMode?: 'due' | 'manual' | 'extra'
}) {
  const [queue, setQueue] = useState(cards)
  const [dynamicAudio, setDynamicAudio] = useState<Record<string, string>>({})
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(false)
  const [sessionStats, setSessionStats] = useState<ReviewSessionStats>({
    total: 0,
    correct: 0,
    durationMs: 0,
    ratings: {
      again: 0,
      hard: 0,
      good: 0,
      easy: 0,
    },
  })
  const [pendingReviewCount, setPendingReviewCount] = useState(0)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [lastRating, setLastRating] = useState<Rating | null>(null)
  const startTimeRef = useRef<number>(0)
  const confettiRef = useRef<ConfettiRef>(null)
  const hasAutoPlayedRef = useRef(false)
  const warmedAudioRef = useRef(new Set<string>())
  const hasPersistedCompletionRef = useRef(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const shouldReduceMotion = useReducedMotion()

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
  const currentStep = Math.min(completedReviews + 1, projectedTotal || total)

  function handleSaveSuccess(
    updatedFields: Record<string, unknown>,
    updatedTags: string[],
    newAudioUrl?: string
  ) {
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
            tags: updatedTags,
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
    if (done) return
    clearReviewSessionCompletionState(deckId, sessionMode)
    persistCompletionUrl(pathname, searchParams.toString(), false)
  }, [deckId, done, pathname, searchParams, sessionMode])

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

  useEffect(() => {
    if (!done || sessionMode !== 'due') return
    if (pendingReviewCount > 0 || syncError) return
    if (hasPersistedCompletionRef.current) return

    hasPersistedCompletionRef.current = true
    void markReviewSessionCompleted(deckId, 'due').catch(() => {
      hasPersistedCompletionRef.current = false
    })
  }, [deckId, done, pendingReviewCount, sessionMode, syncError])

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
    const nextStats: ReviewSessionStats = {
      total: sessionStats.total + 1,
      correct: sessionStats.correct + (rating >= 3 ? 1 : 0),
      durationMs: sessionStats.durationMs + durationMs,
      ratings: {
        again: sessionStats.ratings.again + (rating === 1 ? 1 : 0),
        hard: sessionStats.ratings.hard + (rating === 2 ? 1 : 0),
        good: sessionStats.ratings.good + (rating === 3 ? 1 : 0),
        easy: sessionStats.ratings.easy + (rating === 4 ? 1 : 0),
      },
    }

    setLastRating(rating)
    if (!shouldReduceMotion && (rating === 3 || rating === 4)) {
      confettiRef.current?.fire({
        particleCount: rating === 4 ? 18 : 12,
        spread: rating === 4 ? 52 : 34,
        startVelocity: rating === 4 ? 22 : 18,
        scalar: 0.8,
        ticks: 70,
        gravity: 0.85,
        origin: { x: rating === 4 ? 0.72 : 0.58, y: 0.82 },
      })
    }

    setSessionStats(nextStats)

    const nextQueue = applyReviewQueueOutcome(queue, rating)

    if (nextQueue.length === 0) {
      saveReviewSessionCompletionState(deckId, sessionMode, nextStats)
      persistCompletionUrl(pathname, searchParams.toString(), true)
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
    return (
      <ReviewSessionComplete
        deckId={deckId}
        sessionMode={sessionMode}
        pendingReviewCount={pendingReviewCount}
        syncError={syncError}
        stats={sessionStats}
        onGoHome={() => router.push('/')}
      />
    )
  }

  if (!current) return null

  const flashcardProps = currentPrepared?.flashcardProps
  const intervals = currentPrepared?.intervals

  if (!flashcardProps || !intervals || !currentPrepared) return null

  const sharedHeaderAction = (
    <NoteEditSheet
      noteId={current.note_id}
      deckId={deckId}
      language={lang}
      initialFields={(currentPrepared?.noteFields ?? {}) as Record<string, string>}
      initialTags={current.notes?.tags ?? []}
      onSaveSuccess={handleSaveSuccess}
      trigger={
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors" title="Edit Note">
          <Pencil className="w-4 h-4" />
        </Button>
      }
    />
  )

  const actualFlashcard = (
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
      mobileActionsSticky
      renderRatingButtons={false}
      headerAction={sharedHeaderAction}
    />
  )

  const stackCards = queue.slice(0, 4).map((card, index) => ({
    id: card.id,
    content: index === 0 ? actualFlashcard : (
      <Flashcard
        {...flashcardProps}
        language={lang}
        direction={currentPrepared.direction}
        isRevealed={revealed}
        intervals={intervals}
        previewMode
        renderRatingButtons={false}
        onReveal={() => {}}
        onRate={() => {}}
        className="pointer-events-none"
      />
    ),
  }))

  return (
    <div className="grid min-h-0 flex-1 grid-rows-[1fr_auto]">
      <div className="relative flex min-h-0 items-center justify-center pb-4 pt-16 sm:pt-20">
        <Confetti
          ref={confettiRef}
          manualstart
          className="pointer-events-none absolute inset-0 z-30"
        />
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[32px] opacity-60">
          <Ripple mainCircleSize={140} mainCircleOpacity={0.14} numCircles={7} className="[mask-image:none]" />
        </div>
        <div className="pointer-events-none absolute right-1 top-0 z-20 sm:right-2">
          <AnimatedCircularProgressBar
            value={progress}
            gaugePrimaryColor="rgb(16 185 129)"
            gaugeSecondaryColor="rgba(15, 23, 42, 0.08)"
            className="size-12 text-[10px] sm:size-14 sm:text-xs"
            label={`${currentStep} / ${projectedTotal || total}`}
          />
        </div>
        <div className="relative z-10 w-full max-w-xl">
          <ReactBitsReviewStack
            cards={stackCards}
            activeCardKey={current.id}
            lastRating={lastRating}
          />
        </div>
      </div>
      <ReviewFeedbackDock onRate={handleRating} intervals={intervals} visible={revealed} />
    </div>
  )
}
