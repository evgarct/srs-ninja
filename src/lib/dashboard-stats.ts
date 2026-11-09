import type { SupabaseClient } from '@supabase/supabase-js'
import { countVisibleDueCardsByDeck, getStartOfDayInTimeZone } from '@/lib/dashboard-review'
import {
  getCompletedTodayDeckIds,
  isMissingCompletionTableError,
} from '@/lib/review-session-completions'
import type { Database } from '@/lib/supabase/database.types'

/**
 * Per-deck numbers for the home screen: cards due now (minus those already reviewed today),
 * total cards, drafts, and whether today's session was completed. Shared by the web home
 * (cookie session) and the Android API (Bearer token); both run under the user's RLS.
 */
export async function getDashboardStatsForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
  timeZone = 'UTC'
) {
  const now = new Date().toISOString()

  const { data: decks } = await supabase.from('decks').select('*').order('created_at')
  if (!decks || decks.length === 0) return []

  const deckIds = decks.map((deck) => deck.id)
  const todayStart = getStartOfDayInTimeZone(new Date(), timeZone).toISOString()

  const [
    { data: dueCards, error: dueError },
    { data: reviewedToday, error: reviewedError },
    { data: completedTodayRows, error: completionsError },
  ] = await Promise.all([
    supabase
      .from('cards')
      .select('id, notes!inner(deck_id, status)')
      .in('notes.deck_id', deckIds)
      .eq('notes.status', 'approved')
      .lte('due_at', now),
    supabase
      .from('reviews')
      .select('card_id')
      .eq('user_id', userId)
      .gte('reviewed_at', todayStart),
    supabase
      .from('review_session_completions')
      .select('deck_id, session_type')
      .eq('user_id', userId)
      .gte('completed_at', todayStart),
  ])

  if (dueError) throw dueError
  if (reviewedError) throw reviewedError
  if (completionsError && !isMissingCompletionTableError(completionsError)) {
    throw completionsError
  }

  const visibleDueByDeck = countVisibleDueCardsByDeck(
    (dueCards ?? []).map((card) => {
      const note = Array.isArray(card.notes) ? card.notes[0] : card.notes
      return {
        id: card.id,
        deckId: note?.deck_id ?? '',
      }
    }).filter((card) => card.deckId),
    (reviewedToday ?? []).map((review) => review.card_id)
  )
  const completedTodayDeckIds = getCompletedTodayDeckIds(completedTodayRows ?? null, completionsError)

  return Promise.all(
    decks.map(async (deck) => {
      const [{ count: total }, { count: drafts }] = await Promise.all([
        supabase
          .from('cards')
          .select('*, notes!inner(deck_id, status)', { count: 'exact', head: true })
          .eq('notes.deck_id', deck.id)
          .eq('notes.status', 'approved'),
        supabase
          .from('notes')
          .select('*', { count: 'exact', head: true })
          .eq('deck_id', deck.id)
          .eq('status', 'draft'),
      ])

      return {
        deck,
        due: visibleDueByDeck.get(deck.id) ?? 0,
        total: total ?? 0,
        drafts: drafts ?? 0,
        completedToday: completedTodayDeckIds.has(deck.id),
      }
    })
  )
}
