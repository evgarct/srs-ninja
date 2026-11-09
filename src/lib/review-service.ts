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

function shuffleCards<T>(cards: T[]) {
  const result = [...cards]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[randomIndex]] = [result[randomIndex], result[index]]
  }

  return result
}

export const EXTRA_STUDY_KINDS = ['hard', 'new', 'random', 'forgotten'] as const
export type ExtraStudyKind = (typeof EXTRA_STUDY_KINDS)[number]

export function parseExtraStudyKind(value: string | null | undefined): ExtraStudyKind | undefined {
  return EXTRA_STUDY_KINDS.find((kind) => kind === value)
}

/**
 * Extra study picked by kind (the Android "Ещё 20 сложных" phrase):
 * hard = seen cards with the highest FSRS difficulty, new = unseen cards, forgotten = cards
 * that lapsed (most lapses first), random = any card. Each pool is shuffled within its pick.
 */
export async function getExtraStudyCardsByKind(
  supabase: TypedSupabaseClient,
  deckId: string,
  kind: ExtraStudyKind,
  limit = 20
) {
  const candidateLimit = getReviewSessionCandidateLimit(limit)
  let query = supabase
    .from('cards')
    .select('*, notes!inner(fields, tags, deck_id, status)')
    .eq('notes.deck_id', deckId)
    .eq('notes.status', 'approved')

  if (kind === 'new') query = query.eq('state', 'new').order('created_at', { ascending: true })
  if (kind === 'hard') query = query.neq('state', 'new').order('difficulty', { ascending: false })
  if (kind === 'forgotten') query = query.gt('lapses', 0).order('lapses', { ascending: false })

  const { data, error } = await query.limit(kind === 'hard' || kind === 'forgotten' ? limit : candidateLimit)
  if (error) throw error
  return shuffleCards(data).slice(0, limit)
}

/** Extra study: random new cards first, then the soonest upcoming ones, up to `limit`. */
export async function getExtraStudyCardsForUser(
  supabase: TypedSupabaseClient,
  deckId: string,
  limit = 20
) {
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
