'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { newFSRSCard } from '@/lib/fsrs'
import type { Note } from '@/lib/types'

export async function getNotesByDeck(deckId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notes')
    .select('*, cards(id, card_type, state, due_at, stability, difficulty)')
    .eq('deck_id', deckId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getNote(noteId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notes')
    .select('*, cards(*)')
    .eq('id', noteId)
    .single()
  if (error) throw error
  return data
}

export async function createNote(
  deckId: string,
  fields: Record<string, string>,
  tags: string[]
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: note, error: noteError } = await supabase
    .from('notes')
    .insert({ deck_id: deckId, user_id: user.id, fields, tags })
    .select()
    .single()
  if (noteError) throw noteError

  // Create recognition and production cards
  const fsrsCard = newFSRSCard()
  const now = new Date().toISOString()

  const cards = ['recognition', 'production'].map((cardType) => ({
    note_id: note.id,
    deck_id: deckId,
    user_id: user.id,
    card_type: cardType,
    state: 'new',
    stability: fsrsCard.stability,
    difficulty: fsrsCard.difficulty,
    due_at: now,
    reps: 0,
    lapses: 0,
  }))

  const { error: cardsError } = await supabase.from('cards').insert(cards)
  if (cardsError) throw cardsError

  revalidatePath(`/deck/${deckId}`)
  return note
}

export async function updateNote(
  noteId: string,
  fields: Record<string, string>,
  tags: string[]
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notes')
    .update({ fields, tags })
    .eq('id', noteId)
    .select('deck_id')
    .single()
  if (error) throw error

  revalidatePath(`/deck/${data.deck_id}`)
  revalidatePath(`/notes/${noteId}/edit`)
  return data
}

export async function deleteNote(noteId: string, deckId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('notes').delete().eq('id', noteId)
  if (error) throw error

  revalidatePath(`/deck/${deckId}`)
}
