'use client'

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { submitReview } from '@/lib/actions/cards'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AnimatedCircularProgressBar } from '@/components/ui/animated-circular-progress-bar'
import { Flashcard } from '@/components/flashcard'
import { NoteEditSheet } from '@/components/note-edit-sheet'
import { ReviewRatingBurst } from '@/components/review-rating-burst'
import { ReactBitsReviewStack } from '@/components/vendor/reactbits-review-stack'
import { ArrowLeft, EyeOff, Pencil } from 'lucide-react'
import type { Language, Rating } from '@/lib/types'
import {
  getReviewPrefetchAudioUrls,
  prepareReviewSessionCards,
  type ReviewSessionCard,
} from '@/lib/review-session'
import { applyReviewQueueOutcome } from '@/lib/review-loop'
import { excludeCurrentReviewCard } from '@/lib/review-loop'
import { markReviewSessionCompleted } from '@/lib/actions/decks'
import { ReviewSessionComplete, type ReviewSessionStats } from '@/components/review-session-complete'
import {
  clearReviewSessionCompletionState,
  persistCompletionUrl,
  saveReviewSessionCompletionState,
  shouldResetReviewSessionCompletionState,
  type ReviewSessionMode,
} from '@/lib/review-session-completion-state'
import { getReviewRatingMotion } from '@/lib/review-rating-motion'
import {
  clampReviewSwipeOffset,
  getReviewSwipeAnchorX,
  getReviewSwipeRating,
} from '@/lib/review-swipe'
import { RatingButtons } from '@/components/flashcard/RatingButtons'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

function getTimestamp() {
  return Date.now()
}

// The card's own max-width tracks the session container's responsive width
// (see below) with a constant ~2rem gutter at every breakpoint, so the
// depth-stack ghost cards — sized to the full container — stay visually
// aligned with the active card instead of ballooning past it on desktop.
const REVIEW_SESSION_MAX_WIDTH = 'max-w-[36rem] sm:max-w-[40rem] lg:max-w-[46rem]'
const REVIEW_CARD_MAX_WIDTH = 'max-w-[34rem] sm:max-w-[38rem] lg:max-w-[44rem]'

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
  sessionMode?: ReviewSessionMode
}) {
  const t = useTranslations('review')
  const [queue, setQueue] = useState(cards)
  const [dynamicAudio, setDynamicAudio] = useState<Record<string, string>>({})
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(false)
  const [didCompleteQueue, setDidCompleteQueue] = useState(false)
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
  const [burstState, setBurstState] = useState<{ id: number; rating: Rating; anchorX: number; emoji: string } | null>(null)
  const [swipeOffsetX, setSwipeOffsetX] = useState(0)
  const swipeGestureRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    isTracking: boolean
  } | null>(null)
  const startTimeRef = useRef<number>(0)
  const hasAutoPlayedRef = useRef(false)
  const warmedAudioRef = useRef(new Set<string>())
  const hasPersistedCompletionRef = useRef(false)
  const isCompletingRef = useRef(false)
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
  const sessionLabel = sessionMode === 'manual' ? t('sessionManual') : t('sessionReview')
  const showSessionHeader = sessionMode !== 'extra'
  const showActionBar = revealed || burstState !== null

  const isRecognition = currentPrepared?.direction === 'recognition'
  const audioUrl = currentPrepared?.audioUrl
  const currentStep = Math.min(completedReviews + 1, projectedTotal || total)
  const isSwipeEnabled = revealed && !done

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
    swipeGestureRef.current = null
  }, [current?.id])

  useEffect(() => {
    startTimeRef.current = getTimestamp()
  }, [])

  useEffect(() => {
    if (!burstState) return

    const timeoutId = window.setTimeout(() => {
      setBurstState((currentBurst) => (currentBurst?.id === burstState.id ? null : currentBurst))
    }, 820)

    return () => window.clearTimeout(timeoutId)
  }, [burstState])

  useEffect(() => {
    if (!shouldResetReviewSessionCompletionState(done, isCompletingRef.current)) return

    // Clear stale restore state only when an active session boots up.
    // The completion transition itself mutates the URL with `completed=1`,
    // and this effect must not immediately undo that flag mid-transition.
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
    if (typeof window === 'undefined' || done) return
    if (!window.matchMedia('(max-width: 767px)').matches) return

    const htmlStyle = document.documentElement.style
    const bodyStyle = document.body.style
    const previousHtmlOverscroll = htmlStyle.overscrollBehaviorY
    const previousBodyOverscroll = bodyStyle.overscrollBehaviorY
    const previousBodyOverflow = bodyStyle.overflow

    htmlStyle.overscrollBehaviorY = 'none'
    bodyStyle.overscrollBehaviorY = 'none'
    bodyStyle.overflow = 'hidden'

    return () => {
      htmlStyle.overscrollBehaviorY = previousHtmlOverscroll
      bodyStyle.overscrollBehaviorY = previousBodyOverscroll
      bodyStyle.overflow = previousBodyOverflow
    }
  }, [done])

  useEffect(() => {
    if (!done || !didCompleteQueue || sessionMode === 'manual') return
    if (pendingReviewCount > 0 || syncError) return
    if (hasPersistedCompletionRef.current) return

    hasPersistedCompletionRef.current = true
    void markReviewSessionCompleted(deckId, sessionMode).catch(() => {
      hasPersistedCompletionRef.current = false
    })
  }, [deckId, didCompleteQueue, done, pendingReviewCount, sessionMode, syncError])

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

  function triggerRatingBurst(rating: Rating, anchorX: number) {
    if (shouldReduceMotion) return

    const motionPreset = getReviewRatingMotion(rating)
    const emoji =
      motionPreset.burstEmojis[Math.floor(Math.random() * motionPreset.burstEmojis.length)] ??
      motionPreset.burstEmojis[0] ??
      '✨'

    setBurstState({
      id: Date.now(),
      rating,
      anchorX: Math.min(0.92, Math.max(0.08, anchorX)),
      emoji,
    })
  }

  function handleRatingPress(rating: Rating, button: HTMLButtonElement) {
    const containerRect = actionBarRef.current?.getBoundingClientRect()
    const buttonRect = button.getBoundingClientRect()
    const anchorX = containerRect
      ? (buttonRect.left + buttonRect.width / 2 - containerRect.left) / containerRect.width
      : 0.5

    triggerRatingBurst(rating, anchorX)
  }

  function handleRating(rating: Rating) {
    if (!current) return

    resetSwipeGesture()
    setLastRating(rating)

    const currentCardId = current.id
    const durationMs = getTimestamp() - startTimeRef.current
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

    setSessionStats(nextStats)

    const nextQueue = applyReviewQueueOutcome(queue, rating)

    if (nextQueue.length === 0) {
      setDidCompleteQueue(true)
      isCompletingRef.current = true
      saveReviewSessionCompletionState(deckId, sessionMode, nextStats)
      persistCompletionUrl(pathname, searchParams.toString(), true)
      setDone(true)
    } else {
      setQueue(nextQueue)
      setRevealed(false)
      startTimeRef.current = getTimestamp()
    }

    setPendingReviewCount((count) => count + 1)
    void submitReview(currentCardId, rating, durationMs)
      .catch(() => {
        setSyncError(t('syncError'))
      })
      .finally(() => {
        setPendingReviewCount((count) => Math.max(0, count - 1))
      })
  }

  function handleHideCurrentCard() {
    if (!current) return

    resetSwipeGesture()

    const nextQueue = excludeCurrentReviewCard(queue)

    if (nextQueue.length === 0) {
      setDone(true)
    } else {
      setQueue(nextQueue)
      setRevealed(false)
      startTimeRef.current = getTimestamp()
    }

    toast(t('cardHidden'))
  }

  function handleCardPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isSwipeEnabled || event.pointerType !== 'touch') return

    event.currentTarget.setPointerCapture(event.pointerId)

    swipeGestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      isTracking: false,
    }
  }

  function handleCardPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = swipeGestureRef.current
    if (!gesture || gesture.pointerId !== event.pointerId || event.pointerType !== 'touch') return

    const deltaX = event.clientX - gesture.startX
    const deltaY = event.clientY - gesture.startY

    if (!gesture.isTracking) {
      if (Math.abs(deltaX) < 10) return
      if (Math.abs(deltaX) <= Math.abs(deltaY)) {
        swipeGestureRef.current = null
        setSwipeOffsetX(0)
        return
      }

      gesture.isTracking = true
    }

    setSwipeOffsetX(clampReviewSwipeOffset(deltaX))
  }

  function resetSwipeGesture() {
    swipeGestureRef.current = null
    setSwipeOffsetX(0)
  }

  function handleCardPointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = swipeGestureRef.current
    if (!gesture || gesture.pointerId !== event.pointerId) return

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    const committedOffset = clampReviewSwipeOffset(event.clientX - gesture.startX)
    const swipeRating = getReviewSwipeRating(committedOffset)

    resetSwipeGesture()

    if (swipeRating === null) return

    triggerRatingBurst(swipeRating, getReviewSwipeAnchorX(committedOffset))
    handleRating(swipeRating)
  }

  function handleCardPointerCancel(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = swipeGestureRef.current
    if (!gesture || gesture.pointerId !== event.pointerId) return

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    resetSwipeGesture()
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
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
        title={t('hideCard')}
        aria-label={t('hideCard')}
        onClick={handleHideCurrentCard}
      >
        <EyeOff className="h-4 w-4" />
      </Button>
      <NoteEditSheet
        noteId={current.note_id}
        deckId={deckId}
        language={lang}
        initialFields={(currentPrepared?.noteFields ?? {}) as Record<string, string>}
        initialTags={current.notes?.tags ?? []}
        onSaveSuccess={handleSaveSuccess}
        trigger={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title={t('editNote')}
            aria-label={t('editNote')}
          >
            <Pencil className="w-4 h-4" />
          </Button>
        }
      />
    </div>
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
      maxWidthClassName={REVIEW_CARD_MAX_WIDTH}
      headerAction={sharedHeaderAction}
    />
  )

  const stackCards = queue.slice(0, 4).map((card, index) => ({
    id: card.id,
    content: index === 0 ? actualFlashcard : null,
  }))

  return (
    <div
      className="relative min-h-0 flex-1 overflow-hidden bg-background"
      style={{ overscrollBehaviorY: done ? 'auto' : 'none' }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.1)_0%,transparent_32%),radial-gradient(circle_at_bottom,rgba(234,179,8,0.06)_0%,transparent_26%)] dark:bg-[radial-gradient(circle_at_top,rgba(159,92,255,0.22)_0%,transparent_32%),radial-gradient(circle_at_bottom,rgba(242,255,119,0.08)_0%,transparent_26%)]" />
        <div className="absolute inset-x-0 top-0 h-36 bg-[linear-gradient(180deg,rgba(0,0,0,0.06),transparent)] dark:bg-[linear-gradient(180deg,rgba(0,0,0,0.34),transparent)]" />
      </div>

      <TooltipProvider delay={0} closeDelay={0}>
        <div className="relative z-10 flex h-full min-h-0 flex-col pb-[calc(env(safe-area-inset-bottom)+6.5rem)] sm:pb-[calc(env(safe-area-inset-bottom)+7rem)]">
          <div className={`mx-auto flex w-full min-h-0 flex-1 flex-col px-3 pb-3 pt-3 sm:px-4 sm:pb-5 sm:pt-4 ${REVIEW_SESSION_MAX_WIDTH}`}>
            <div className="flex items-center justify-between gap-3 pb-3 sm:pb-4">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleExitReview}
                      className="h-10 w-10 rounded-full border border-foreground/10 bg-foreground/[0.04] text-foreground/76 shadow-[0_18px_30px_-22px_rgba(0,0,0,0.35)] backdrop-blur-xl hover:bg-foreground/[0.08] hover:text-foreground"
                      aria-label={t('exitReview')}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  }
                />
                <TooltipContent side="bottom" sideOffset={10}>
                  {t('exitReview')}
                </TooltipContent>
              </Tooltip>

              <div className="min-w-0 text-center">
                {showSessionHeader ? (
                  <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground sm:text-xs">
                    {sessionLabel}
                  </div>
                ) : null}
              </div>

              <div className="shrink-0">
                <AnimatedCircularProgressBar
                  value={progress}
                  gaugePrimaryColor="var(--primary)"
                  gaugeSecondaryColor="color-mix(in oklch, var(--foreground) 14%, transparent)"
                  className="size-12 text-[10px] text-foreground sm:size-14 sm:text-xs"
                  label={`${currentStep} / ${projectedTotal || total}`}
                />
              </div>
            </div>

            <div className={`relative mx-auto flex min-h-0 w-full flex-1 items-center justify-center pb-2 sm:pb-4 ${REVIEW_SESSION_MAX_WIDTH}`}>
              <AnimatePresence>
                {burstState ? (
                  <motion.div
                    key={burstState.id}
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: [0, 0.9, 0], scale: 1.7 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                  >
                    <div
                      className="h-[70%] w-[70%] rounded-full blur-2xl"
                      style={{
                        background: `radial-gradient(circle, ${getReviewRatingMotion(burstState.rating).glowColor} 0%, transparent 72%)`,
                      }}
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <ReactBitsReviewStack
                cards={stackCards}
                activeCardKey={current.id}
                lastRating={lastRating}
                maxVisible={4}
                activeCardAnimate={
                  isSwipeEnabled && swipeOffsetX !== 0
                    ? {
                        opacity: Math.max(0.74, 1 - Math.abs(swipeOffsetX) / 340),
                        x: swipeOffsetX,
                        y: 0,
                        scale: 1,
                        rotate: swipeOffsetX / 20,
                      }
                    : undefined
                }
                activeCardStyle={{
                  touchAction: done ? 'auto' : isSwipeEnabled ? 'none' : 'manipulation',
                }}
                onActivePointerDown={handleCardPointerDown}
                onActivePointerMove={handleCardPointerMove}
                onActivePointerUp={handleCardPointerEnd}
                onActivePointerCancel={handleCardPointerCancel}
              />
            </div>
          </div>

          <AnimatePresence>
            {showActionBar ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+0.85rem)] pt-6 sm:px-4"
              >
                <div
                  ref={actionBarRef}
                  className={`relative rounded-full border border-foreground/10 bg-background/80 px-3 py-2 shadow-[0_28px_80px_-28px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-opacity duration-150 ${revealed ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-100'}`}
                >
                  <AnimatePresence>
                    {burstState ? (
                      <ReviewRatingBurst
                        key={`${burstState.id}-${burstState.rating}`}
                        rating={burstState.rating}
                        emoji={burstState.emoji}
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
