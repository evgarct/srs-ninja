'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { submitReview } from '@/lib/actions/cards'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AnimatedCircularProgressBar } from '@/components/ui/animated-circular-progress-bar'
import { Flashcard } from '@/components/flashcard'
import { NoteEditSheet } from '@/components/note-edit-sheet'
import { ReviewRatingBurst } from '@/components/review-rating-burst'
import { ArrowLeft, Pencil } from 'lucide-react'
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
import { getReviewRatingMotion } from '@/lib/review-rating-motion'
import { RatingButtons } from '@/components/flashcard/RatingButtons'

function getSessionLabel(sessionMode: 'due' | 'manual' | 'extra') {
  if (sessionMode === 'manual') return 'Manual review'
  if (sessionMode === 'extra') return ''
  return 'Review'
}

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
  const [burstState, setBurstState] = useState<{ id: number; rating: Rating; anchorX: number } | null>(null)
  const startTimeRef = useRef<number>(0)
  const hasAutoPlayedRef = useRef(false)
  const warmedAudioRef = useRef(new Set<string>())
  const hasPersistedCompletionRef = useRef(false)
  const actionBarRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const shouldReduceMotion = useReducedMotion() ?? false

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
  const sessionLabel = getSessionLabel(sessionMode)
  const showSessionHeader = sessionMode !== 'extra'
  const ratingMotion = lastRating ? getReviewRatingMotion(lastRating) : null
  const showActionBar = revealed || burstState !== null

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
    if (!burstState) return

    const timeoutId = window.setTimeout(() => {
      setBurstState((currentBurst) => (currentBurst?.id === burstState.id ? null : currentBurst))
    }, 820)

    return () => window.clearTimeout(timeoutId)
  }, [burstState])

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

  function handleExitReview() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }

    router.push(`/deck/${deckId}`)
  }

  function handleRatingPress(rating: Rating, button: HTMLButtonElement) {
    if (shouldReduceMotion) return

    const containerRect = actionBarRef.current?.getBoundingClientRect()
    const buttonRect = button.getBoundingClientRect()
    const anchorX = containerRect
      ? (buttonRect.left + buttonRect.width / 2 - containerRect.left) / containerRect.width
      : 0.5

    setBurstState({
      id: Date.now(),
      rating,
      anchorX: Math.min(0.92, Math.max(0.08, anchorX)),
    })
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

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden bg-[#dedede]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0.18)_24%,rgba(255,255,255,0.12)_48%,rgba(255,255,255,0.34)_78%,rgba(255,255,255,0.58)_100%)]" />
        <div className="absolute inset-y-0 left-0 w-[24%] bg-[linear-gradient(90deg,rgba(255,255,255,0.52)_0%,rgba(255,255,255,0.22)_42%,rgba(255,255,255,0)_100%)]" />
        <div className="absolute inset-y-0 right-0 w-[24%] bg-[linear-gradient(270deg,rgba(255,255,255,0.52)_0%,rgba(255,255,255,0.22)_42%,rgba(255,255,255,0)_100%)]" />
      </div>

      <TooltipProvider delay={0} closeDelay={0}>
        <div className="relative z-10 flex h-full min-h-0 flex-col pb-[calc(env(safe-area-inset-bottom)+7rem)] sm:pb-[calc(env(safe-area-inset-bottom)+8rem)]">
          <div className="mx-auto flex w-full max-w-xl min-h-0 flex-1 flex-col px-2 pb-3 pt-3 sm:px-4 sm:pb-5 sm:pt-4">
            <div className="flex items-center justify-between gap-3 pb-2 sm:pb-3">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleExitReview}
                      className="h-10 w-10 rounded-full border border-white/35 bg-white/78 text-foreground/75 shadow-[0_12px_28px_-18px_rgba(15,23,42,0.38)] backdrop-blur-xl hover:bg-white/92 hover:text-foreground"
                      aria-label="Exit review"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  }
                />
                <TooltipContent side="bottom" sideOffset={10}>
                  Exit review
                </TooltipContent>
              </Tooltip>

              <div className="min-w-0 text-center">
                {showSessionHeader ? (
                  <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-foreground/55 sm:text-xs">
                    {sessionLabel}
                  </div>
                ) : null}
              </div>

              <div className="shrink-0">
                <AnimatedCircularProgressBar
                  value={progress}
                  gaugePrimaryColor="rgb(16 185 129)"
                  gaugeSecondaryColor="rgba(15, 23, 42, 0.08)"
                  className="size-12 text-[10px] sm:size-14 sm:text-xs"
                  label={`${currentStep} / ${projectedTotal || total}`}
                />
              </div>
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center pt-1 sm:pt-3">
              <div className="relative w-full max-w-xl">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={current.id}
                    initial={
                      shouldReduceMotion
                        ? { opacity: 0, y: 8, scale: 0.995 }
                        : ratingMotion?.enter ?? { opacity: 0, y: 18, scale: 0.985 }
                    }
                    animate={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
                    exit={
                      shouldReduceMotion
                        ? { opacity: 0, y: -10, scale: 0.99 }
                        : ratingMotion?.exit ?? { opacity: 0, y: -18, scale: 0.97 }
                    }
                    transition={{ type: 'spring', stiffness: 230, damping: 24, mass: 0.88 }}
                    className="relative z-10"
                  >
                    {actualFlashcard}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showActionBar ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:px-4"
              >
                <div
                  ref={actionBarRef}
                  className={`relative transition-opacity duration-150 ${revealed ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-100'}`}
                >
                  <AnimatePresence>
                    {burstState ? (
                      <ReviewRatingBurst
                        key={`${burstState.id}-${burstState.rating}`}
                        rating={burstState.rating}
                        reducedMotion={shouldReduceMotion}
                        anchorX={burstState.anchorX}
                        className="absolute inset-x-0 -top-28 bottom-0"
                      />
                    ) : null}
                  </AnimatePresence>
                  <RatingButtons
                    visualStyle="floating"
                    onRate={handleRating}
                    onRatePress={handleRatingPress}
                    intervals={intervals}
                  />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </TooltipProvider>
    </div>
  )
}
