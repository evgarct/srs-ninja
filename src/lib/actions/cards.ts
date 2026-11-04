'use server'

import type { AudioFilter, FsrsState } from '@/lib/deck-notes'
import { getReviewSessionCandidateLimit } from '@/lib/review-card-selection'
import { getDueCardsForUser, getManualStudyCardsForUser, submitReviewForUser } from '@/lib/review-service'
import { createClient } from '@/lib/supabase/server'
import type { Rating } from '@/lib/types'

function shuffleCards<T>(cards: T[]) {
  const result = [...cards]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[randomIndex]] = [result[randomIndex], result[index]]
  }

  return result
}

export async function getDueCards(deckId: string, limit = 20) {
  const supabase = await createClient()
  return getDueCardsForUser(supabase, deckId, limit)
}

export async function getExtraStudyCards(deckId: string, limit = 20) {
  const supabase = await createClient()
  const now = new Date().toISOString()
  const candidateLimit = getReviewSessionCandidateLimit(limit)

  const { data: newCardPool, error: newErr } = await supabase
    .from('cards')
    .select('*, notes!inner(fields, tags, deck_id, status)')
    .eq('notes.deck_id', deckId)
    .eq('notes.status', 'approved')
    .eq('state', 'new')
    .order('created_at', { ascending: true })
    .limit(candidateLimit)

  if (newErr) throw newErr

  const newCards = shuffleCards(newCardPool).slice(0, limit)

  if (newCards.length >= limit) return newCards

  const remaining = limit - newCards.length
  const { data: upcomingCards, error: upErr } = await supabase
    .from('cards')
    .select('*, notes!inner(fields, tags, deck_id, status)')
    .eq('notes.deck_id', deckId)
    .eq('notes.status', 'approved')
    .neq('state', 'new')
    .gt('due_at', now)
    .order('due_at', { ascending: true })
    .limit(remaining)

  if (upErr) throw upErr

  return [...newCards, ...upcomingCards]
}

export async function getManualStudyCards(
  deckId: string,
  {
    tags = [],
    states = [],
    audioFilter = 'all',
  }: {
    tags?: string[]
    states?: FsrsState[]
    audioFilter?: AudioFilter
  }
) {
  const supabase = await createClient()
  return getManualStudyCardsForUser(supabase, deckId, { tags, states, audioFilter })
}

export async function submitReview(
  cardId: string,
  rating: Rating,
  durationMs: number
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  return submitReviewForUser(supabase, user.id, cardId, rating, durationMs)
}
