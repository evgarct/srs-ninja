'use server'

import { createClient } from '@/lib/supabase/server'
import { scheduleCard } from '@/lib/fsrs'
import type { Rating } from '@/lib/types'
import { filterDeckNotes, type AudioFilter, type FsrsState } from '@/lib/deck-notes'

/**
 * Retrieves a limited list of cards that are currently due for review within a given deck.
 * 
 * Cards are ordered by their due date (oldest first).
 * 
 * @param deckId - The UUID of the deck to fetch cards from.
 * @param limit - The maximum number of due cards to return (default: 20).
 * @returns A promise that resolves to an array of card objects with their associated notes.
 */
export async function getDueCards(deckId: string, limit = 20) {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('cards')
    .select('*, notes!inner(fields, tags, deck_id, status)')
    .eq('notes.deck_id', deckId)
    .eq('notes.status', 'approved')
    .lte('due_at', now)
    .order('due_at', { ascending: true })
    .limit(limit)
  if (error) throw error
  return data
}

/**
 * Adaptive extra study session card fetcher.
 *
 * Fills a session of up to `limit` cards using a two-tier strategy:
 *   1. New cards (state = 'new') — sorted by creation date ASC (oldest first).
 *   2. If fewer than `limit` new cards exist, the remaining slots are filled
 *      with upcoming cards (state ≠ 'new', due_at > now) sorted by due_at ASC,
 *      i.e. the soonest-to-be-due cards are studied early.
 *
 * When the user rates a card that is not yet due, ts-fsrs automatically computes
 * a shorter elapsed_days (= days since last_review, not the scheduled interval),
 * which the FSRS-6 algorithm accounts for correctly without any extra handling.
 *
 * @param deckId - The UUID of the deck to fetch cards from.
 * @param limit  - Maximum cards to return (default 20).
 * @returns A promise resolving to an array of card objects with their associated notes.
 */
export async function getExtraStudyCards(deckId: string, limit = 20) {
  const supabase = await createClient()
  const now = new Date().toISOString()

  // 1. Fetch as many new cards as possible (up to limit)
  const { data: newCards, error: newErr } = await supabase
    .from('cards')
    .select('*, notes!inner(fields, tags, deck_id, status)')
    .eq('notes.deck_id', deckId)
    .eq('notes.status', 'approved')
    .eq('state', 'new')
    .order('created_at', { ascending: true })
    .limit(limit)
  if (newErr) throw newErr

  // If we already have `limit` new cards, return them immediately
  if (newCards.length >= limit) return newCards

  // 2. Top up with upcoming cards (not yet due, any non-new state)
  const remaining = limit - newCards.length
  const { data: upcomingCards, error: upErr } = await supabase
    .from('cards')
    .select('*, notes!inner(fields, tags, deck_id, status)')
    .eq('notes.deck_id', deckId)
    .eq('notes.status', 'approved')
    .neq('state', 'new')
    .gt('due_at', now)          // future only — already-due cards belong in the normal queue
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

  const { data: notes, error: notesError } = await supabase
    .from('notes')
    .select('id, fields, tags, cards(id, card_type, state, due_at)')
    .eq('deck_id', deckId)
    .eq('status', 'approved')

  if (notesError || !notes) throw notesError ?? new Error('Failed to fetch notes')

  const noteIds = notes.map((note) => note.id)
  const { data: audioRows, error: audioError } = noteIds.length
    ? await supabase
        .from('audio_cache')
        .select('note_id, storage_path')
        .in('note_id', noteIds)
        .eq('field_key', 'expression')
    : { data: [], error: null }

  if (audioError) throw audioError

  const audioMap = Object.fromEntries((audioRows ?? []).map((row) => [row.note_id, row.storage_path]))

  const visibleNotes = filterDeckNotes(
    notes.map((note) => ({
      id: note.id,
      fields: note.fields as Record<string, unknown>,
      tags: note.tags ?? [],
      cards: (note.cards as Array<{ id: string; card_type: string; state: string; due_at: string }>) ?? [],
    })),
    {
      tagFilters: tags,
      stateFilters: states,
      audioFilter,
    },
    audioMap
  )

  if (visibleNotes.length === 0) return []

  const visibleNoteIds = visibleNotes.map((note) => note.id)
  const { data: cards, error: cardsError } = await supabase
    .from('cards')
    .select('*, notes!inner(fields, tags, deck_id, status)')
    .eq('notes.deck_id', deckId)
    .eq('notes.status', 'approved')
    .in('note_id', visibleNoteIds)
    .order('due_at', { ascending: true })

  if (cardsError) throw cardsError
  return cards
}


/**
 * Submits a Spaced Repetition (FSRS) review for a specific card.
 * 
 * This action performs multiple steps in a single transaction-like sequence:
 * 1. Fetches the card's current state.
 * 2. Uses the FSRS algorithm to calculate the new scheduling parameters based on the user's rating.
 * 3. Updates the card's state and due date in the database.
 * 4. Logs the review event in the `reviews` table for analytics and history.
 * 
 * @param cardId - The UUID of the card being reviewed.
 * @param rating - The user's self-assessed rating of the review (e.g. 'Again', 'Hard', 'Good', 'Easy').
 * @param durationMs - The time taken by the user to answer the card, measured in milliseconds.
 * @throws Error - Throws if the user is not authenticated or if any database operation fails.
 * @returns An object containing the FSRS-updated card data and the number of scheduled days until the next review.
 */
export async function submitReview(
  cardId: string,
  rating: Rating,
  durationMs: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: card, error: fetchError } = await supabase
    .from('cards')
    .select('*')
    .eq('id', cardId)
    .single()
  if (fetchError) throw fetchError

  const now = new Date()
  const { updatedCard, scheduledDays, elapsedDays } = scheduleCard(card, rating, now)

  const { error: updateError } = await supabase
    .from('cards')
    .update(updatedCard)
    .eq('id', cardId)
  if (updateError) throw updateError

  const { error: reviewError } = await supabase.from('reviews').insert({
    card_id: cardId,
    user_id: user.id,
    rating,
    state: updatedCard.state ?? card.state,
    scheduled_days: scheduledDays,
    elapsed_days: elapsedDays,
    review_duration_ms: durationMs,
    reviewed_at: now.toISOString(),
  })
  if (reviewError) throw reviewError

  return { updatedCard, scheduledDays }
}
