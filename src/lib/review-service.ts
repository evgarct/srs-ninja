import type { SupabaseClient } from '@supabase/supabase-js'
import { filterDeckNotes, type AudioFilter, type FsrsState } from '@/lib/deck-notes'
import { scheduleCard } from '@/lib/fsrs'
import { getReviewSessionCandidateLimit } from '@/lib/review-card-selection'
import type { Database } from '@/lib/supabase/database.types'
import type { Rating } from '@/lib/types'

type TypedSupabaseClient = SupabaseClient<Database>

/**
 * Review data access shared by the cookie-bound server actions and the MCP tools.
 *
 * Server actions run under the user's RLS session and omit `userId`. MCP passes it
 * explicitly because the legacy shared-secret mode uses an admin client without RLS.
 */

const RATING_BY_NAME: Record<string, Rating> = { again: 1, hard: 2, good: 3, easy: 4 }

export function parseReviewRating(value: string | number): Rating | null {
  if (typeof value === 'number') return value === 1 || value === 2 || value === 3 || value === 4 ? value : null
  return RATING_BY_NAME[value.trim().toLowerCase()] ?? null
}

export async function getDueCardsForUser(
  supabase: TypedSupabaseClient,
  deckId: string,
  limit: number,
  userId?: string
) {
  const now = new Date().toISOString()
  const candidateLimit = getReviewSessionCandidateLimit(limit)

  let query = supabase
    .from('cards')
    .select('*, notes!inner(fields, tags, deck_id, status)')
    .eq('notes.deck_id', deckId)
    .eq('notes.status', 'approved')
    .lte('due_at', now)

  if (userId) query = query.eq('user_id', userId)

  const { data, error } = await query.order('due_at', { ascending: true }).limit(candidateLimit)

  if (error) throw error
  return data
}

export async function getManualStudyCardsForUser(
  supabase: TypedSupabaseClient,
  deckId: string,
  {
    tags = [],
    states = [],
    audioFilter = 'all',
  }: {
    tags?: string[]
    states?: FsrsState[]
    audioFilter?: AudioFilter
  },
  userId?: string
) {
  let notesQuery = supabase
    .from('notes')
    .select('id, fields, tags, cards(id, card_type, state, due_at)')
    .eq('deck_id', deckId)
    .eq('status', 'approved')

  if (userId) notesQuery = notesQuery.eq('user_id', userId)

  const { data: notes, error: notesError } = await notesQuery

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
  let cardsQuery = supabase
    .from('cards')
    .select('*, notes!inner(fields, tags, deck_id, status)')
    .eq('notes.deck_id', deckId)
    .eq('notes.status', 'approved')
    .in('note_id', visibleNoteIds)

  if (userId) cardsQuery = cardsQuery.eq('user_id', userId)

  const { data: cards, error: cardsError } = await cardsQuery.order('due_at', { ascending: true })

  if (cardsError) throw cardsError
  return cards
}

export async function submitReviewForUser(
  supabase: TypedSupabaseClient,
  userId: string,
  cardId: string,
  rating: Rating,
  durationMs: number
) {
  const { data: card, error: fetchError } = await supabase
    .from('cards')
    .select('*')
    .eq('id', cardId)
    .eq('user_id', userId)
    .single()

  if (fetchError) throw fetchError

  const now = new Date()
  const { updatedCard, scheduledDays, elapsedDays } = scheduleCard(card, rating, now)

  const { error: updateError } = await supabase
    .from('cards')
    .update(updatedCard)
    .eq('id', cardId)
    .eq('user_id', userId)

  if (updateError) throw updateError

  const { error: reviewError } = await supabase.from('reviews').insert({
    card_id: cardId,
    user_id: userId,
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
