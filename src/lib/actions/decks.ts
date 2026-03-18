'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Deck, Language } from '@/lib/types'
import { countVisibleDueCardsByDeck, getStartOfDayInTimeZone } from '@/lib/dashboard-review'

/**
 * Retrieves all decks for the current user.
 * 
 * @returns A promise that resolves to an array of all available decks, ordered by creation date.
 */
export async function getDecks(): Promise<Deck[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

/**
 * Retrieves a specific deck along with its aggregated statistics.
 * 
 * This fetches the deck details, the total number of notes, the total number 
 * of cards generated from those notes, and how many cards are currently due 
 * for review (due_at <= now).
 * 
 * @param deckId - The UUID of the deck to retrieve.
 * @returns An object containing the deck data and its associated counts.
 */
export async function getDeckWithStats(deckId: string) {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data: deck } = await supabase.from('decks').select('*').eq('id', deckId).single()

  const [{ count: totalNotes }, { count: draftNotes }, { count: totalCards }, { count: dueCards }] =
    await Promise.all([
      supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('deck_id', deckId)
        .eq('status', 'approved'),
      supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('deck_id', deckId)
        .eq('status', 'draft'),
      supabase
        .from('cards')
        .select('*, notes!inner(deck_id, status)', { count: 'exact', head: true })
        .eq('notes.deck_id', deckId)
        .eq('notes.status', 'approved'),
      supabase
        .from('cards')
        .select('*, notes!inner(deck_id, status)', { count: 'exact', head: true })
        .eq('notes.deck_id', deckId)
        .eq('notes.status', 'approved')
        .lte('due_at', now),
    ])

  return {
    deck,
    totalCards: totalCards ?? 0,
    dueCards: dueCards ?? 0,
    totalNotes: totalNotes ?? 0,
    draftNotes: draftNotes ?? 0,
  }
}

/**
 * Retrieves statistics for all decks to be displayed on the main dashboard.
 * 
 * For each deck, queries the database to determine the total number of cards
 * and the number of cards that are currently due for review.
 * 
 * @returns A promise that resolves to an array of deck statistics objects.
 */
export async function getDashboardStats(timeZone = 'UTC') {
  const supabase = await createClient()
  const now = new Date().toISOString()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: decks } = await supabase.from('decks').select('*').order('created_at')
  if (!decks) return []
  if (decks.length === 0) return []

  const deckIds = decks.map((deck) => deck.id)
  const todayStart = getStartOfDayInTimeZone(new Date(), timeZone).toISOString()

  const [{ data: dueCards, error: dueError }, { data: reviewedToday, error: reviewedError }] = await Promise.all([
    supabase
      .from('cards')
      .select('id, notes!inner(deck_id, status)')
      .in('notes.deck_id', deckIds)
      .eq('notes.status', 'approved')
      .lte('due_at', now),
    supabase
      .from('reviews')
      .select('card_id')
      .eq('user_id', user.id)
      .gte('reviewed_at', todayStart),
  ])

  if (dueError) throw dueError
  if (reviewedError) throw reviewedError

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

  const stats = await Promise.all(
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

      return { deck, due: visibleDueByDeck.get(deck.id) ?? 0, total: total ?? 0, drafts: drafts ?? 0 }
    })
  )
  return stats
}

/**
 * Creates a new flashcard deck for the currently authenticated user.
 * 
 * @param name - The human-readable name of the new deck.
 * @param language - The language identifier for the deck context (e.g. 'english', 'czech').
 * @throws Error - Throws if the user is not authenticated or if the insert operation fails.
 * @returns A promise resolving to the newly created deck data.
 */
export async function createDeck(name: string, language: Language) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('decks')
    .insert({ name, language, user_id: user.id })
    .select()
    .single()
  if (error) throw error

  revalidatePath('/')
  return data
}
