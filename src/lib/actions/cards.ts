'use server'

import { filterDeckNotes, type AudioFilter, type FsrsState } from '@/lib/deck-notes'
import { scheduleCard } from '@/lib/fsrs'
import { getReviewSessionCandidateLimit } from '@/lib/review-card-selection'
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
  const now = new Date().toISOString()
  const candidateLimit = getReviewSessionCandidateLimit(limit)

  const { data, error } = await supabase
    .from('cards')
    .select('*, notes!inner(fields, tags, deck_id, status)')
    .eq('notes.deck_id', deckId)
    .eq('notes.status', 'approved')
    .lte('due_at', now)
    .order('due_at', { ascending: true })
    .limit(candidateLimit)

  if (error) throw error
  return data
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
