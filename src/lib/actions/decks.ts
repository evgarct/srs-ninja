'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Deck, Language } from '@/lib/types'

export async function getDecks(): Promise<Deck[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function getDeckWithStats(deckId: string) {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data: deck } = await supabase.from('decks').select('*').eq('id', deckId).single()

  const { count: totalNotes } = await supabase
    .from('notes')
    .select('*', { count: 'exact', head: true })
    .eq('deck_id', deckId)

  const { count: totalCards } = await supabase
    .from('cards')
    .select('*, notes!inner(deck_id)', { count: 'exact', head: true })
    .eq('notes.deck_id', deckId)

  const { count: dueCards } = await supabase
    .from('cards')
    .select('*, notes!inner(deck_id)', { count: 'exact', head: true })
    .eq('notes.deck_id', deckId)
    .lte('due_at', now)

  return {
    deck,
    totalCards: totalCards ?? 0,
    dueCards: dueCards ?? 0,
    totalNotes: totalNotes ?? 0,
  }
}

export async function getDashboardStats() {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data: decks } = await supabase.from('decks').select('*').order('created_at')
  if (!decks) return []

  const stats = await Promise.all(
    decks.map(async (deck) => {
      const [{ count: due }, { count: total }] = await Promise.all([
        supabase
          .from('cards')
          .select('*, notes!inner(deck_id)', { count: 'exact', head: true })
          .eq('notes.deck_id', deck.id)
          .lte('due_at', now),
        supabase
          .from('cards')
          .select('*, notes!inner(deck_id)', { count: 'exact', head: true })
          .eq('notes.deck_id', deck.id),
      ])
      return { deck, due: due ?? 0, total: total ?? 0 }
    })
  )
  return stats
}

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
