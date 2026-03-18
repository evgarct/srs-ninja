'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getNotePrimaryText, normalizeNoteFields } from '@/lib/note-fields'
import { buildInitialNoteCards } from '@/lib/note-cards'
import { shouldGenerateAudioForNote } from '@/lib/note-audio'
import type { Language } from '@/lib/types'

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
    .eq('status', 'approved')
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
  language: Language,
  fields: Record<string, unknown>,
  tags: string[]
) {
  const normalizedFields = normalizeNoteFields(fields, language)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: note, error: noteError } = await supabase
    .from('notes')
    .insert({
      deck_id: deckId,
      user_id: user.id,
      fields: normalizedFields,
      tags,
      status: 'approved',
      source: 'manual',
    })
    .select()
    .single()
  if (noteError) throw noteError

  const cards = buildInitialNoteCards(note.id, user.id)

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
  language: Language,
  fields: Record<string, unknown>,
  tags: string[]
) {
  const normalizedFields = normalizeNoteFields(fields, language)
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notes')
    .update({ fields: normalizedFields, tags })
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
 * @param forceAudio - Explicitly force TTS regeneration even if expression didn't change.
 */
export async function updateNoteFields(
  noteId: string,
  deckId: string,
  newFields: Record<string, unknown>,
  newTags: string[],
  oldExpression: string,
  language: string,
  forceAudio: boolean = false
) {
  const normalizedFields = normalizeNoteFields(newFields, language as Language)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('notes')
    .update({ fields: normalizedFields, tags: newTags })
    .eq('id', noteId)

  if (error) throw error

  let audioUrl: string | undefined
  let audioError: string | undefined

  const { data: noteStatusRow, error: noteStatusError } = await supabase
    .from('notes')
    .select('status')
    .eq('id', noteId)
    .single()

  if (noteStatusError) throw noteStatusError

  // Audio stays separate from draft import: only approved notes may regenerate TTS.
  const newExpression = getNotePrimaryText(normalizedFields)
  if (
    newExpression &&
    shouldGenerateAudioForNote({
      language,
      status: noteStatusRow.status,
      forceAudio,
      expressionChanged: newExpression !== oldExpression,
    })
  ) {
    const { generateAndCacheAudio } = await import('@/lib/tts')
    const result = await generateAndCacheAudio(supabase, user.id, noteId, newExpression, language)
    if ('audioUrl' in result) {
      audioUrl = result.audioUrl
    } else {
      audioError = result.error
    }
  }

  revalidatePath(`/deck/${deckId}`)
  revalidatePath(`/deck/${deckId}/drafts`)
  
  return { success: true, audioUrl, audioError }
}
