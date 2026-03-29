import type { ReviewSessionStats } from '@/components/review-session-complete'

export type ReviewSessionMode = 'due' | 'manual' | 'extra'

interface StoredCompletionState {
  deckId: string
  sessionMode: ReviewSessionMode
  stats: ReviewSessionStats
  storedAt: number
}

const STORAGE_PREFIX = 'review-session-complete:'

function getStorageKey(deckId: string, sessionMode: ReviewSessionMode) {
  return `${STORAGE_PREFIX}${deckId}:${sessionMode}`
}

export function buildCompletionUrl(
  pathname: string,
  search: string,
  shouldMarkCompleted: boolean
) {
  const params = new URLSearchParams(search)

  if (shouldMarkCompleted) {
    params.set('completed', '1')
  } else {
    params.delete('completed')
  }

  const nextSearch = params.toString()
  return nextSearch ? `${pathname}?${nextSearch}` : pathname
}

export function persistCompletionUrl(
  pathname: string,
  search: string,
  shouldMarkCompleted: boolean
) {
  if (typeof window === 'undefined') return

  const nextUrl = buildCompletionUrl(pathname, search, shouldMarkCompleted)
  window.history.replaceState(window.history.state, '', nextUrl)
}

export function shouldResetReviewSessionCompletionState(
  done: boolean,
  completionTransitionInFlight: boolean
) {
  return !done && !completionTransitionInFlight
}

export function saveReviewSessionCompletionState(
  deckId: string,
  sessionMode: ReviewSessionMode,
  stats: ReviewSessionStats
) {
  if (typeof window === 'undefined') return

  const payload: StoredCompletionState = {
    deckId,
    sessionMode,
    stats,
    storedAt: Date.now(),
  }

  window.sessionStorage.setItem(getStorageKey(deckId, sessionMode), JSON.stringify(payload))
}

export function readReviewSessionCompletionState(
  deckId: string,
  sessionMode: ReviewSessionMode
): ReviewSessionStats | null {
  if (typeof window === 'undefined') return null

  const raw = window.sessionStorage.getItem(getStorageKey(deckId, sessionMode))
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<StoredCompletionState>
    if (
      parsed.deckId !== deckId ||
      parsed.sessionMode !== sessionMode ||
      !parsed.stats
    ) {
      return null
    }

    return parsed.stats
  } catch {
    return null
  }
}

export function clearReviewSessionCompletionState(
  deckId: string,
  sessionMode: ReviewSessionMode
) {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(getStorageKey(deckId, sessionMode))
}
