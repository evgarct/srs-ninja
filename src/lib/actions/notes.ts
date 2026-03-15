'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { newFSRSCard } from '@/lib/fsrs'
import type { Note } from '@/lib/types'

/**
 * Retrieves all notes for a specific deck, including their associated generated cards.
 * 
 * @param deckId - The UUID of the deck to retrieve notes for.
 * @returns A promise resolving to an array of notes, ordered by creation date (newest first).
 */
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

/**
 * Retrieves a single note by its ID, including all its associated cards.
 * 
 * @param noteId - The UUID of the note to retrieve.
 * @returns A promise resolving to the note data.
 */
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

/**
 * Creates a new note in a specific deck and automatically generates its associated flashcards.
 * 
 * This action performs two main tasks:
 * 1. Inserts the root note with the provided fields (e.g., front/back content) and tags.
 * 2. Automatically generates the corresponding 'recognition' and 'production' cards for the note,
 *    assigning them default FSRS stability and difficulty parameters.
 * 
 * @param deckId - The UUID of the deck where the note belongs.
 * @param fields - A key-value record of the note's content (e.g., { front: 'Hello', back: 'Ahoj' }).
 * @param tags - An array of tag strings associated with the note.
 * @throws Error - Throws if the user is not authenticated or if database insertion fails.
 * @returns A promise resolving to the created note data.
 */
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

/**
 * Updates an existing note's fields and tags.
 * 
 * @param noteId - The UUID of the note to update.
 * @param fields - The updated key-value record of the note's content.
 * @param tags - The updated array of tag strings.
 * @throws Error - Throws if the update operation fails.
 * @returns A promise resolving to the updated note's partial data (deck_id).
 */
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

/**
 * Deletes a note from the database.
 * 
 * By database constraints, deleting a note should cascade and also delete
 * all its associated generated cards and their review history.
 * 
 * @param noteId - The UUID of the note to delete.
 * @param deckId - The UUID of the deck the note belongs to (used for revalidation).
 * @throws Error - Throws if the deletion operation fails.
 */
export async function deleteNote(noteId: string, deckId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('notes').delete().eq('id', noteId)
  if (error) throw error

  revalidatePath(`/deck/${deckId}`)
}

/**
 * Updates a note's fields (from the inline Note Editor) and regenerates TTS audio if needed.
 * 
 * @param noteId - The UUID of the note to update.
 * @param deckId - The UUID of the deck the note belongs to.
 * @param newFields - The updated key-value record of the note's content.
 * @param oldExpression - The previous expression to check for changes.
 * @param language - The language of the deck (used for TTS decision).
 */
export async function updateNoteFields(
  noteId: string,
  deckId: string,
  newFields: Record<string, any>,
  oldExpression: string,
  language: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('notes')
    .update({ fields: newFields })
    .eq('id', noteId)

  if (error) throw error

  let audioUrl: string | undefined

  // Trigger TTS regeneration if the expression changed and language is english
  const newExpression = newFields.expression || newFields.term
  if (language === 'english' && newExpression && newExpression !== oldExpression) {
    const { generateAndCacheAudio } = await import('@/lib/tts')
    const result = await generateAndCacheAudio(supabase, user.id, noteId, newExpression, language)
    if ('audioUrl' in result) {
      audioUrl = result.audioUrl
    }
  }

  revalidatePath(`/deck/${deckId}`)
  
  return { success: true, audioUrl }
}
