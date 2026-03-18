import type { SupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { buildInitialNoteCards } from '@/lib/note-cards'
import {
  findDuplicateDraftCandidates,
  getImportBatchStatus,
  validateDraftCandidate,
  type DraftCandidateInput,
} from '@/lib/draft-import'
import type { Database } from '@/lib/supabase/database.types'
import type { Language } from '@/lib/types'

type DeckRow = Database['public']['Tables']['decks']['Row']
type NoteRow = Database['public']['Tables']['notes']['Row']
type ImportBatchRow = Database['public']['Tables']['import_batches']['Row']

export interface DraftBatchMetadata {
  modelName?: string
  promptVersion?: string
  topic?: string
  requestedTags?: string[]
  inputPayload?: Record<string, unknown>
}

export interface SaveDraftNotesResult {
  batchId: string
  createdNoteIds: string[]
  skippedItems: Array<{ index: number; reason: string }>
  warnings: string[]
}

export interface DraftNoteListItem extends NoteRow {
  deck_name?: string
}

async function getOwnedDeckOrThrow(
  supabase: SupabaseClient,
  userId: string,
  deckId: string
): Promise<DeckRow> {
  const { data: deck, error } = await supabase
    .from('decks')
    .select('*')
    .eq('id', deckId)
    .eq('user_id', userId)
    .single()

  if (error || !deck) throw error ?? new Error('Deck not found')
  return deck
}

async function syncImportBatchStatus(
  supabase: SupabaseClient,
  batchId: string
) {
  const { data: notes, error } = await supabase
    .from('notes')
    .select('status')
    .eq('import_batch_id', batchId)

  if (error) throw error

  const nextStatus = getImportBatchStatus(
    ((notes ?? []) as Array<{ status: 'draft' | 'approved' }>).map((note) => note.status)
  )

  const { error: updateError } = await supabase
    .from('import_batches')
    .update({ status: nextStatus })
    .eq('id', batchId)

  if (updateError) throw updateError
}

export async function saveDraftNotesForUser(
  supabase: SupabaseClient,
  userId: string,
  deckId: string,
  items: DraftCandidateInput[],
  metadata: DraftBatchMetadata = {}
): Promise<SaveDraftNotesResult> {
  const deck = await getOwnedDeckOrThrow(supabase, userId, deckId)
  const language = deck.language as Language

  const validationResults = items.map((item) => validateDraftCandidate(language, item))
  const validCandidates = validationResults
    .map((result, index) => ({ result, index }))
    .filter((entry) => entry.result.candidate)

  const warnings = validationResults.flatMap((result, index) => [
    ...result.warnings.map((warning) => `Item ${index + 1}: ${warning.message}`),
    ...result.errors.map((error) => `Item ${index + 1}: ${error.message}`),
  ])

  const skippedItems = validationResults.flatMap((result, index) =>
    result.candidate
      ? []
      : [{ index, reason: result.errors.map((error) => error.message).join('; ') || 'Validation failed' }]
  )

  const { data: existingNotes, error: existingNotesError } = await supabase
    .from('notes')
    .select('id, fields')
    .eq('deck_id', deckId)
    .eq('user_id', userId)

  if (existingNotesError) throw existingNotesError

  const duplicateMatches = findDuplicateDraftCandidates(
    ((existingNotes ?? []) as Array<{ id: string; fields: Record<string, unknown> }>).map((note) => ({
      id: note.id,
      fields: (note.fields as Record<string, unknown>) ?? {},
    })),
    validCandidates.map((entry) => entry.result.candidate!)
  )

  const duplicateIndexSet = new Set(duplicateMatches.map((duplicate) => duplicate.index))

  for (const duplicate of duplicateMatches) {
    const originalIndex = validCandidates[duplicate.index]?.index ?? duplicate.index
    skippedItems.push({
      index: originalIndex,
      reason: `Duplicate note already exists for "${duplicate.primaryText}"`,
    })
    warnings.push(
      `Item ${originalIndex + 1}: duplicate note "${duplicate.primaryText}" already exists in this deck.`
    )
  }

  const notesToInsert = validCandidates
    .filter((_, index) => !duplicateIndexSet.has(index))
    .map((entry) => entry.result.candidate!)

  if (notesToInsert.length === 0) {
    return {
      batchId: '',
      createdNoteIds: [],
      skippedItems: skippedItems.sort((a, b) => a.index - b.index),
      warnings,
    }
  }

  const { data: batch, error: batchError } = await supabase
    .from('import_batches')
    .insert({
      user_id: userId,
      deck_id: deckId,
      source: 'mcp_ai_import',
      status: 'draft',
      input_payload: metadata.inputPayload ?? null,
      model_name: metadata.modelName ?? null,
      prompt_version: metadata.promptVersion ?? null,
      topic: metadata.topic ?? null,
      requested_tags: metadata.requestedTags ?? [],
      notes_count: notesToInsert.length,
    })
    .select()
    .single()

  if (batchError || !batch) throw batchError ?? new Error('Failed to create import batch')

  let createdNoteIds: string[] = []

  if (notesToInsert.length > 0) {
    const { data: insertedNotes, error: insertError } = await supabase
      .from('notes')
      .insert(
        notesToInsert.map((candidate) => ({
          user_id: userId,
          deck_id: deckId,
          fields: candidate.fields,
          tags: candidate.tags,
          status: 'draft',
          source: 'ai_import',
          import_batch_id: batch.id,
        }))
      )
      .select('id')

    if (insertError) throw insertError
    createdNoteIds = ((insertedNotes ?? []) as Array<{ id: string }>).map((note) => note.id)
  }

  revalidatePath(`/deck/${deckId}`)
  revalidatePath(`/deck/${deckId}/drafts`)

  return {
    batchId: batch.id,
    createdNoteIds,
    skippedItems: skippedItems.sort((a, b) => a.index - b.index),
    warnings,
  }
}

export async function listDraftBatchesForUser(
  supabase: SupabaseClient,
  userId: string,
  deckId?: string
): Promise<ImportBatchRow[]> {
  let query = supabase
    .from('import_batches')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (deckId) query = query.eq('deck_id', deckId)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as ImportBatchRow[]
}

export async function listDraftNotesForUser(
  supabase: SupabaseClient,
  userId: string,
  options: {
    deckId?: string
    batchId?: string
  } = {}
): Promise<DraftNoteListItem[]> {
  let query = supabase
    .from('notes')
    .select('*, decks(name)')
    .eq('user_id', userId)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })

  if (options.deckId) query = query.eq('deck_id', options.deckId)
  if (options.batchId) query = query.eq('import_batch_id', options.batchId)

  const { data, error } = await query
  if (error) throw error

  return ((data ?? []) as Array<NoteRow & { decks?: { name: string } | Array<{ name: string }> }>).map((note) => ({
    ...(note as NoteRow),
    deck_name: Array.isArray(note.decks) ? note.decks?.[0]?.name : note.decks?.name,
  }))
}

export async function approveDraftNoteForUser(
  supabase: SupabaseClient,
  userId: string,
  noteId: string
) {
  const { data: note, error: noteError } = await supabase
    .from('notes')
    .select('*')
    .eq('id', noteId)
    .eq('user_id', userId)
    .single()

  if (noteError || !note) throw noteError ?? new Error('Draft note not found')
  const typedNote = note as NoteRow
  if (typedNote.status !== 'draft') throw new Error('Note is already approved')

  const { error: updateError } = await supabase
    .from('notes')
    .update({ status: 'approved' })
    .eq('id', noteId)
  if (updateError) throw updateError

  const cards = buildInitialNoteCards(typedNote.id, userId)
  const { error: cardsError } = await supabase.from('cards').insert(cards)
  if (cardsError) throw cardsError

  if (typedNote.import_batch_id) {
    await syncImportBatchStatus(supabase, typedNote.import_batch_id)
  }

  revalidatePath(`/deck/${typedNote.deck_id}`)
  revalidatePath(`/deck/${typedNote.deck_id}/drafts`)

  return {
    noteId: typedNote.id,
    deckId: typedNote.deck_id,
    importBatchId: typedNote.import_batch_id,
  }
}
