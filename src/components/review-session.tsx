'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { submitReview } from '@/lib/actions/cards'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { markReviewSessionCompleted } from '@/lib/actions/decks'
import { ReviewSessionComplete, type ReviewSessionStats } from '@/components/review-session-complete'
import { cn } from '@/lib/utils'
import {
  clearReviewSessionCompletionState,
  persistCompletionUrl,
  saveReviewSessionCompletionState,
} from '@/lib/review-session-completion-state'

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
  const startTimeRef = useRef<number>(0)
  const hasAutoPlayedRef = useRef(false)
  const warmedAudioRef = useRef(new Set<string>())
  const hasPersistedCompletionRef = useRef(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

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
  const remainingCards = queue.length
  const progress = projectedTotal > 0
    ? Math.round((completedReviews / projectedTotal) * 100)
    : 0

  const isRecognition = currentPrepared?.direction === 'recognition'
  const audioUrl = currentPrepared?.audioUrl
  const sessionChrome = getSessionChrome(sessionMode, remainingCards)

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

  const noteFields = currentPrepared?.noteFields ?? {}
  const flashcardProps = currentPrepared?.flashcardProps
  const intervals = currentPrepared?.intervals

  if (!flashcardProps || !intervals || !currentPrepared) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border bg-muted/20 px-4 py-3 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className={cn('gap-1.5', sessionChrome.badgeClassName)}>
                {sessionChrome.badgeLabel}
              </Badge>
              <Badge variant="outline" className="tabular-nums">
                Осталось {remainingCards}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {sessionChrome.description}
            </p>
          </div>
          <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
            {Math.min(completedReviews + 1, projectedTotal || total)} / {projectedTotal || total}
          </span>
        </div>
        <Progress value={progress} className="mt-3 h-2.5" />
      </div>

      <div className="relative pt-4">
        <div className="pointer-events-none absolute inset-x-0 top-8 flex justify-center">
          {[0, 1].map((layer) => {
            const isVisible = remainingCards > layer + 1

            return (
              <div
                key={layer}
                className={cn(
                  'absolute h-[calc(100%-0.75rem)] w-full max-w-xl rounded-[28px] border bg-card/70 shadow-sm transition-opacity',
                  layer === 0 && 'translate-y-3 scale-[0.985] opacity-70',
                  layer === 1 && 'translate-y-6 scale-[0.97] opacity-45',
                  !isVisible && 'opacity-0'
                )}
              />
            )
          })}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.985 }}
            transition={{ type: 'spring', stiffness: 240, damping: 24 }}
            className="relative"
          >
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
                  initialTags={current.notes?.tags ?? []}
                  onSaveSuccess={handleSaveSuccess}
                  trigger={
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors" title="Edit Note">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  }
                />
              }
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function getSessionChrome(sessionMode: 'due' | 'manual' | 'extra', remainingCards: number) {
  if (sessionMode === 'manual') {
    return {
      badgeLabel: 'Manual review',
      badgeClassName: 'bg-sky-500/10 text-sky-700',
      description: `Фильтрованный набор в фокусе. Осталось ${remainingCards} карточек в текущей выборке.`,
    }
  }

  if (sessionMode === 'extra') {
    return {
      badgeLabel: 'Extra study',
      badgeClassName: 'bg-violet-500/10 text-violet-700',
      description: `Дополнительная практика вне основной due-очереди. Осталось ${remainingCards} карточек.`,
    }
  }

  return {
    badgeLabel: 'Due review',
    badgeClassName: 'bg-emerald-500/10 text-emerald-700',
    description: `Сегодняшняя основная очередь в работе. Осталось ${remainingCards} карточек до конца текущей сессии.`,
  }
}
