'use client'

import { useRouter } from 'next/navigation'

import {
  ReviewSessionComplete,
  type ReviewSessionStats,
} from '@/components/review-session-complete'
import {
  readReviewSessionCompletionState,
  type ReviewSessionMode,
} from '@/lib/review-session-completion-state'

const EMPTY_STATS: ReviewSessionStats = {
  total: 0,
  correct: 0,
  durationMs: 0,
  ratings: {
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  },
}

export function ReviewSessionCompleteRestore({
  deckId,
  sessionMode,
}: {
  deckId: string
  sessionMode: ReviewSessionMode
}) {
  const router = useRouter()
  const stats = readReviewSessionCompletionState(deckId, sessionMode) ?? EMPTY_STATS

  return (
    <ReviewSessionComplete
      deckId={deckId}
      sessionMode={sessionMode}
      pendingReviewCount={0}
      syncError={null}
      stats={stats}
      onGoHome={() => router.push('/')}
    />
  )
}
