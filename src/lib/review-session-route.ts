import { isFsrsState, normalizeAudioFilter, type AudioFilter, type FsrsState } from '@/lib/deck-notes'
import type { ReviewSessionMode } from '@/lib/review-session-completion-state'

export interface ReviewSessionSearchParams {
  mode?: string
  limit?: string
  tags?: string
  state?: string
  audio?: string
  completed?: string
}

export interface ParsedReviewSessionSearchParams {
  sessionMode: ReviewSessionMode
  isCompleted: boolean
  limit: number
  manualTags: string[]
  manualStates: FsrsState[]
  manualAudioFilter: AudioFilter
}

function clampExtraLimit(value: string | number | undefined) {
  const parsed = typeof value === 'number' ? value : parseInt(value ?? '10', 10)
  return Math.min(Math.max(parsed || 10, 1), 50)
}

export function resolveReviewSessionMode(mode?: string): ReviewSessionMode {
  if (mode === 'extra') return 'extra'
  if (mode === 'manual') return 'manual'
  return 'due'
}

export function parseReviewSessionSearchParams(
  searchParams: ReviewSessionSearchParams
): ParsedReviewSessionSearchParams {
  return {
    sessionMode: resolveReviewSessionMode(searchParams.mode),
    isCompleted: searchParams.completed === '1',
    limit: clampExtraLimit(searchParams.limit),
    manualTags: (searchParams.tags ?? '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    manualStates: (searchParams.state ?? '')
      .split(',')
      .map((state) => state.trim())
      .filter(isFsrsState) as FsrsState[],
    manualAudioFilter: normalizeAudioFilter(searchParams.audio),
  }
}

export function buildReviewSessionHref(
  deckId: string,
  options: {
    mode?: ReviewSessionMode
    limit?: number
    tags?: string[]
    states?: FsrsState[]
    audio?: AudioFilter
    completed?: boolean
  } = {}
) {
  const {
    mode = 'due',
    limit,
    tags = [],
    states = [],
    audio = 'all',
    completed = false,
  } = options

  const params = new URLSearchParams()

  if (mode !== 'due') {
    params.set('mode', mode)
  }

  if (mode === 'extra' && typeof limit === 'number') {
    params.set('limit', String(clampExtraLimit(limit)))
  }

  if (mode === 'manual') {
    if (tags.length > 0) {
      params.set('tags', tags.join(','))
    }

    if (states.length > 0) {
      params.set('state', states.join(','))
    }

    if (audio !== 'all') {
      params.set('audio', audio)
    }
  }

  if (completed) {
    params.set('completed', '1')
  }

  const query = params.toString()
  return query ? `/review/${deckId}?${query}` : `/review/${deckId}`
}
