'use server'

import { createClient } from '@/lib/supabase/server'
import { scheduleCard } from '@/lib/fsrs'
import type { Rating } from '@/lib/types'

export async function getDueCards(deckId: string, limit = 20) {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('cards')
    .select('*, notes!inner(fields, tags, deck_id)')
    .eq('notes.deck_id', deckId)
    .lte('due_at', now)
    .order('due_at', { ascending: true })
    .limit(limit)
  if (error) throw error
  return data
}

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
