import type { SupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { buildInitialNoteCards } from '@/lib/note-cards'
import { normalizeNoteFields } from '@/lib/note-fields'
import { normalizeNoteTags } from '@/lib/note-tags'
import {
  canDeleteDraftBatch,
  createDraftConflictMetadata,
  findDuplicateDraftCandidates,
  findSimilarDraftCandidates,
  getImportBatchStatus,
  validateDraftCandidate,
  type DraftConflictMetadata,
  type DraftNoteStatus,
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

export type DraftNoteListItem = Omit<NoteRow, 'draft_conflict'> & {
  deck_name?: string
  draft_conflict: DraftConflictMetadata | null
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

async function deleteImportBatchIfEmpty(
  supabase: SupabaseClient,
  batchId: string
) {
  const { count, error: countError } = await supabase
    .from('notes')
    .select('id', { count: 'exact', head: true })
    .eq('import_batch_id', batchId)

  if (countError) throw countError
  if ((count ?? 0) > 0) return false

  const { error: deleteError } = await supabase
    .from('import_batches')
    .delete()
    .eq('id', batchId)

  if (deleteError) throw deleteError
  return true
}

function parseDraftConflict(
  value: unknown
): DraftConflictMetadata | null {
  if (!value || typeof value !== 'object') return null

  const conflict = value as Partial<DraftConflictMetadata> & {
    matchedNoteId?: unknown
    matchedPrimaryText?: unknown
    similarityScore?: unknown
    resolution?: unknown
  }

  if (
    conflict.kind !== 'similar_existing_note' ||
    typeof conflict.matchedNoteId !== 'string' ||
    typeof conflict.matchedPrimaryText !== 'string' ||
    typeof conflict.similarityScore !== 'number' ||
    (conflict.resolution !== 'open' &&
      conflict.resolution !== 'kept_separate' &&
      conflict.resolution !== 'ignored')
  ) {
    return null
  }

  return {
    kind: 'similar_existing_note',
    matchedNoteId: conflict.matchedNoteId,
    matchedPrimaryText: conflict.matchedPrimaryText,
    similarityScore: conflict.similarityScore,
    resolution: conflict.resolution,
    resolvedAt: typeof conflict.resolvedAt === 'string' ? conflict.resolvedAt : undefined,
  }
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
    .select('id, fields, draft_conflict')
    .eq('deck_id', deckId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

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

  const remainingCandidates = validCandidates.filter((_, index) => !duplicateIndexSet.has(index))
  const similarMatches = findSimilarDraftCandidates(
    ((existingNotes ?? []) as Array<{ id: string; fields: Record<string, unknown> }>).map((note) => ({
      id: note.id,
      fields: (note.fields as Record<string, unknown>) ?? {},
    })),
    remainingCandidates.map((entry) => entry.result.candidate!)
  )

  const similarIndexSet = new Set(similarMatches.map((similar) => similar.index))

  for (const similar of similarMatches) {
    const originalIndex = remainingCandidates[similar.index]?.index ?? similar.index
    warnings.push(
      `Item ${originalIndex + 1}: similar note "${similar.primaryText}" matches an existing note (${Math.round(
        similar.similarityScore * 100
      )}% similar).`
    )
  }

  const notesToInsert = remainingCandidates.map((entry, index) => ({
    ...entry.result.candidate!,
    draft_conflict: similarIndexSet.has(index)
      ? createDraftConflictMetadata(similarMatches.find((match) => match.index === index)!)
      : null,
  }))

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
          draft_conflict: candidate.draft_conflict,
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
    draft_conflict: parseDraftConflict((note as NoteRow & { draft_conflict?: unknown }).draft_conflict),
  }))
}

export async function resolveDraftConflictForUser(
  supabase: SupabaseClient,
  userId: string,
  noteId: string,
  resolution: 'kept_separate' | 'ignored'
) {
  const { data: note, error: noteError } = await supabase
    .from('notes')
    .select('id, deck_id, fields, tags, draft_conflict, status, import_batch_id')
    .eq('id', noteId)
    .eq('user_id', userId)
    .single()

  if (noteError || !note) throw noteError ?? new Error('Draft note not found')
  if (note.status !== 'draft') throw new Error('Only draft notes can be resolved')

  const conflict = parseDraftConflict((note as NoteRow & { draft_conflict?: unknown }).draft_conflict)
  if (!conflict || conflict.resolution !== 'open') {
    throw new Error('This draft note does not have an open similar-note conflict')
  }

  const { error: updateError } = await supabase
    .from('notes')
    .update({
      draft_conflict: {
        ...conflict,
        resolution,
        resolvedAt: new Date().toISOString(),
      },
    })
    .eq('id', noteId)
    .eq('user_id', userId)
    .eq('status', 'draft')

  if (updateError) throw updateError

  revalidatePath(`/deck/${note.deck_id}`)
  revalidatePath(`/deck/${note.deck_id}/drafts`)
  revalidatePath('/import')

  return {
    noteId,
    deckId: note.deck_id,
    importBatchId: note.import_batch_id,
    resolution,
  }
}

export async function applyDraftConflictToExistingNoteForUser(
  supabase: SupabaseClient,
  userId: string,
  noteId: string
) {
  const { data: draftNote, error: draftNoteError } = await supabase
    .from('notes')
    .select('id, deck_id, fields, tags, draft_conflict, status, import_batch_id')
    .eq('id', noteId)
    .eq('user_id', userId)
    .single()

  if (draftNoteError || !draftNote) throw draftNoteError ?? new Error('Draft note not found')
  if (draftNote.status !== 'draft') throw new Error('Only draft notes can be updated from a conflict')

  const conflict = parseDraftConflict((draftNote as NoteRow & { draft_conflict?: unknown }).draft_conflict)
  if (!conflict || conflict.resolution !== 'open') {
    throw new Error('This draft note does not have an open similar-note conflict')
  }

  const { data: targetNote, error: targetNoteError } = await supabase
    .from('notes')
    .select('id, deck_id, fields, tags')
    .eq('id', conflict.matchedNoteId)
    .eq('user_id', userId)
    .single()

  if (targetNoteError || !targetNote) throw targetNoteError ?? new Error('Matched note not found')

  const deck = await getOwnedDeckOrThrow(supabase, userId, targetNote.deck_id)
  const normalizedFields = normalizeNoteFields(
    (draftNote.fields as Record<string, unknown>) ?? {},
    deck.language as Language
  )
  const mergedTags = normalizeNoteTags([
    ...(((targetNote.tags as string[]) ?? [])),
    ...(((draftNote.tags as string[]) ?? [])),
  ])

  const { error: updateError } = await supabase
    .from('notes')
    .update({
      fields: normalizedFields,
      tags: mergedTags,
    })
    .eq('id', targetNote.id)
    .eq('user_id', userId)

  if (updateError) throw updateError

  await deleteDraftNoteForUser(supabase, userId, noteId)

  revalidatePath(`/deck/${targetNote.deck_id}`)
  revalidatePath(`/deck/${targetNote.deck_id}/drafts`)

  return {
    noteId,
    updatedNoteId: targetNote.id,
    deckId: targetNote.deck_id,
    importBatchId: draftNote.import_batch_id,
  }
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
  const conflict = parseDraftConflict((typedNote as NoteRow & { draft_conflict?: unknown }).draft_conflict)
  if (conflict?.resolution === 'open') {
    throw new Error('Resolve the similar-note conflict before approving this draft')
  }

  const { data: updatedNote, error: updateError } = await supabase
    .from('notes')
    .update({ status: 'approved' })
    .eq('user_id', userId)
    .eq('id', noteId)
    .eq('status', 'draft')
    .select('id, deck_id, import_batch_id')
    .single()

  if (updateError || !updatedNote) {
    throw updateError ?? new Error('Note is already approved')
  }

  const cards = buildInitialNoteCards(typedNote.id, userId)
  const { error: cardsError } = await supabase.from('cards').insert(cards)
  if (cardsError) throw cardsError

  if (updatedNote.import_batch_id) {
    await syncImportBatchStatus(supabase, updatedNote.import_batch_id)
  }

  revalidatePath(`/deck/${updatedNote.deck_id}`)
  revalidatePath(`/deck/${updatedNote.deck_id}/drafts`)

  return {
    noteId: updatedNote.id,
    deckId: updatedNote.deck_id,
    importBatchId: updatedNote.import_batch_id,
  }
}

export async function deleteDraftNoteForUser(
  supabase: SupabaseClient,
  userId: string,
  noteId: string
) {
  const { data: note, error: noteError } = await supabase
    .from('notes')
    .select('id, deck_id, import_batch_id, status')
    .eq('id', noteId)
    .eq('user_id', userId)
    .single()

  if (noteError || !note) throw noteError ?? new Error('Draft note not found')
  if (note.status !== 'draft') throw new Error('Only draft notes can be deleted')

  const { error: deleteError } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', userId)
    .eq('status', 'draft')

  if (deleteError) throw deleteError

  if (note.import_batch_id) {
    const deletedBatch = await deleteImportBatchIfEmpty(supabase, note.import_batch_id)
    if (!deletedBatch) {
      await syncImportBatchStatus(supabase, note.import_batch_id)
    }
  }

  revalidatePath(`/deck/${note.deck_id}`)
  revalidatePath(`/deck/${note.deck_id}/drafts`)
  revalidatePath('/import')

  return {
    noteId: note.id,
    deckId: note.deck_id,
    importBatchId: note.import_batch_id,
  }
}

export async function deleteDraftBatchForUser(
  supabase: SupabaseClient,
  userId: string,
  batchId: string
) {
  const { data: batch, error: batchError } = await supabase
    .from('import_batches')
    .select('id, deck_id')
    .eq('id', batchId)
    .eq('user_id', userId)
    .single()

  if (batchError || !batch) throw batchError ?? new Error('Draft batch not found')

  const { data: notes, error: notesError } = await supabase
    .from('notes')
    .select('id, status')
    .eq('import_batch_id', batchId)
    .eq('user_id', userId)

  if (notesError) throw notesError

  const statuses = ((notes ?? []) as Array<{ status: DraftNoteStatus }>).map((note) => note.status)
  if (!canDeleteDraftBatch(statuses)) {
    throw new Error('Only batches with draft notes only can be deleted')
  }

  const { error: deleteNotesError } = await supabase
    .from('notes')
    .delete()
    .eq('import_batch_id', batchId)
    .eq('user_id', userId)

  if (deleteNotesError) throw deleteNotesError

  const { error: deleteBatchError } = await supabase
    .from('import_batches')
    .delete()
    .eq('id', batchId)
    .eq('user_id', userId)

  if (deleteBatchError) throw deleteBatchError

  revalidatePath(`/deck/${batch.deck_id}`)
  revalidatePath(`/deck/${batch.deck_id}/drafts`)
  revalidatePath('/import')

  return {
    batchId,
    deckId: batch.deck_id,
  }
}
