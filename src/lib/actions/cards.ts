'use server'

import type { AudioFilter, FsrsState } from '@/lib/deck-notes'
import {
  getDueCardsForUser,
  getExtraStudyCardsForUser,
  getManualStudyCardsForUser,
  submitReviewForUser,
} from '@/lib/review-service'
import { createClient } from '@/lib/supabase/server'
import type { Rating } from '@/lib/types'

export async function getDueCards(deckId: string, limit = 20) {
  const supabase = await createClient()
  return getDueCardsForUser(supabase, deckId, limit)
}

export async function getExtraStudyCards(deckId: string, limit = 20) {
  const supabase = await createClient()
  return getExtraStudyCardsForUser(supabase, deckId, limit)
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
