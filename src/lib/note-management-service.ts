import type { SupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { shouldGenerateAudioForNote } from '@/lib/note-audio'
import { getNotePrimaryText } from '@/lib/note-fields'
import {
  applyDraftConflictToExistingNoteForUser,
  approveDraftBatchForUser,
  approveDraftNoteForUser,
  deleteDraftNoteForUser,
  resolveDraftConflictForUser,
} from '@/lib/draft-import-service'
import {
  applyTagEdit,
  filterManagedNotes,
  prepareNoteUpdate,
  toManagedNote,
  type ManagedNoteRow,
  type NoteListFilters,
  type NoteStatusFilter,
  type NoteUpdateInput,
  type TagEdit,
} from '@/lib/note-management'
import type { Language } from '@/lib/types'

// Shared by the MCP tools. Draft approval, draft deletion and conflict resolution reuse the
// exact services behind the web drafts screen; field normalization and audio rules reuse the
// web note editor helpers.

const NOTE_COLUMNS = 'id, deck_id, status, fields, tags, import_batch_id, created_at, updated_at, cards(id, card_type, state, due_at)'
const ID_CHUNK = 100
export const LIST_PAGE = 1000

export type ItemResult = { noteId: string; ok: true; [key: string]: unknown } | { noteId: string; ok: false; error: string }

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message
  return 'Unknown error'
}

function chunk<T>(items: T[], size: number) {
  const result: T[][] = []
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size))
  return result
}

async function getDeckLanguages(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase.from('decks').select('id, language').eq('user_id', userId)
  if (error) throw error
  return new Map(((data ?? []) as Array<{ id: string; language: string }>).map((deck) => [deck.id, deck.language as Language]))
}

async function getOwnedNotesByIds(supabase: SupabaseClient, userId: string, noteIds: string[]) {
  const rows: ManagedNoteRow[] = []
  for (const ids of chunk([...new Set(noteIds)], ID_CHUNK)) {
    const { data, error } = await supabase.from('notes').select(NOTE_COLUMNS).eq('user_id', userId).in('id', ids)
    if (error) throw error
    rows.push(...((data ?? []) as ManagedNoteRow[]))
  }
  return new Map(rows.map((row) => [row.id, row]))
}

function revalidateDeck(deckId: string) {
  revalidatePath(`/deck/${deckId}`)
  revalidatePath(`/deck/${deckId}/drafts`)
}

export async function listNotesForUser(
  supabase: SupabaseClient,
  userId: string,
  deckId: string,
  options: NoteListFilters & { status?: NoteStatusFilter; limit?: number; offset?: number } = {}
) {
  // PostgREST caps a response (1000 rows by default), so read the deck in pages before
  // filtering in memory; otherwise total and offsets would only cover the first page.
  const rows: ManagedNoteRow[] = []
  for (let from = 0; ; from += LIST_PAGE) {
    let query = supabase.from('notes').select(NOTE_COLUMNS).eq('user_id', userId).eq('deck_id', deckId)
    if (options.status && options.status !== 'all') query = query.eq('status', options.status)
    const { data, error } = await query.order('created_at', { ascending: false }).order('id').range(from, from + LIST_PAGE - 1)
    if (error) throw error
    rows.push(...((data ?? []) as ManagedNoteRow[]))
    if (!data || data.length < LIST_PAGE) break
  }
  const matching = filterManagedNotes(rows, options)
  const offset = options.offset ?? 0
  const limit = options.limit ?? 50
  return { total: matching.length, offset, notes: matching.slice(offset, offset + limit).map(toManagedNote) }
}

export async function getNoteForUser(supabase: SupabaseClient, userId: string, noteId: string) {
  const note = (await getOwnedNotesByIds(supabase, userId, [noteId])).get(noteId)
  if (!note) throw new Error('Note not found')
  return toManagedNote(note)
}

export async function updateNotesForUser(supabase: SupabaseClient, userId: string, items: NoteUpdateInput[]): Promise<ItemResult[]> {
  const [notes, languages] = await Promise.all([
    getOwnedNotesByIds(supabase, userId, items.map((item) => item.noteId)),
    getDeckLanguages(supabase, userId),
  ])
  const touchedDecks = new Set<string>()
  const results: ItemResult[] = []

  for (const { noteId, ...update } of items) {
    const note = notes.get(noteId)
    const language = note ? languages.get(note.deck_id) : undefined
    if (!note || !language) { results.push({ noteId, ok: false, error: 'Note not found' }); continue }
    try {
      const prepared = prepareNoteUpdate(language, { fields: note.fields ?? {}, tags: note.tags ?? [] }, update)
      if (prepared.errors.length) {
        results.push({ noteId, ok: false, error: prepared.errors.map((issue) => issue.message).join('; ') })
        continue
      }
      const { error } = await supabase.from('notes').update({ fields: prepared.fields, tags: prepared.tags }).eq('id', noteId).eq('user_id', userId)
      if (error) throw error
      touchedDecks.add(note.deck_id)
      // A later item for the same note must build on this write, not on the original snapshot.
      notes.set(noteId, { ...note, fields: prepared.fields, tags: prepared.tags })

      // Same rule as the web editor: only approved notes regenerate audio, and only when the word changed.
      let audioError: string | undefined
      if (shouldGenerateAudioForNote({ language, status: note.status, forceAudio: false, expressionChanged: prepared.primaryTextChanged })) {
        const { generateAndCacheAudio } = await import('@/lib/tts')
        const audio = await generateAndCacheAudio(supabase, userId, noteId, getNotePrimaryText(prepared.fields), language)
        if ('error' in audio) audioError = audio.error
      }
      results.push({ noteId, ok: true, status: note.status, fields: prepared.fields, tags: prepared.tags, ...(audioError ? { audioError } : {}) })
    } catch (error) {
      results.push({ noteId, ok: false, error: errorMessage(error) })
    }
  }

  touchedDecks.forEach(revalidateDeck)
  return results
}

/** Resolves note ids from explicit ids or a draft batch (all of its notes, any status). */
export async function resolveNoteIdsForUser(supabase: SupabaseClient, userId: string, selector: { noteIds?: string[]; batchId?: string }) {
  if (selector.noteIds?.length) return [...new Set(selector.noteIds)]
  if (!selector.batchId) return []
  const { data, error } = await supabase.from('notes').select('id').eq('user_id', userId).eq('import_batch_id', selector.batchId)
  if (error) throw error
  return ((data ?? []) as Array<{ id: string }>).map((note) => note.id)
}

export async function editNoteTagsForUser(supabase: SupabaseClient, userId: string, noteIds: string[], edit: TagEdit): Promise<ItemResult[]> {
  const notes = await getOwnedNotesByIds(supabase, userId, noteIds)
  const touchedDecks = new Set<string>()
  const results: ItemResult[] = []
  for (const noteId of [...new Set(noteIds)]) {
    const note = notes.get(noteId)
    if (!note) { results.push({ noteId, ok: false, error: 'Note not found' }); continue }
    const tags = applyTagEdit(note.tags ?? [], edit)
    const { error } = await supabase.from('notes').update({ tags }).eq('id', noteId).eq('user_id', userId)
    if (error) { results.push({ noteId, ok: false, error: errorMessage(error) }); continue }
    touchedDecks.add(note.deck_id)
    results.push({ noteId, ok: true, tags })
  }
  touchedDecks.forEach(revalidateDeck)
  return results
}

export async function approveDraftsForUser(supabase: SupabaseClient, userId: string, selector: { noteIds?: string[]; batchId?: string }) {
  if (selector.batchId && !selector.noteIds?.length) return approveDraftBatchForUser(supabase, userId, selector.batchId)
  const results: ItemResult[] = []
  for (const noteId of [...new Set(selector.noteIds ?? [])]) {
    try { await approveDraftNoteForUser(supabase, userId, noteId); results.push({ noteId, ok: true }) }
    catch (error) { results.push({ noteId, ok: false, error: errorMessage(error) }) }
  }
  return { results }
}

export async function resolveDraftConflictsForUser(
  supabase: SupabaseClient,
  userId: string,
  noteId: string,
  resolution: 'kept_separate' | 'ignored' | 'apply_to_existing'
) {
  return resolution === 'apply_to_existing'
    ? applyDraftConflictToExistingNoteForUser(supabase, userId, noteId)
    : resolveDraftConflictForUser(supabase, userId, noteId, resolution)
}

/**
 * Deletes drafts through the drafts service (keeps batch state in sync) and approved notes
 * directly; approved deletion cascades to cards and review history, like deleteNotes on the web.
 */
export async function deleteNotesForUser(supabase: SupabaseClient, userId: string, noteIds: string[]): Promise<ItemResult[]> {
  const notes = await getOwnedNotesByIds(supabase, userId, noteIds)
  const results: ItemResult[] = []
  const touchedDecks = new Set<string>()
  for (const noteId of [...new Set(noteIds)]) {
    const note = notes.get(noteId)
    if (!note) { results.push({ noteId, ok: false, error: 'Note not found' }); continue }
    try {
      if (note.status === 'draft') {
        await deleteDraftNoteForUser(supabase, userId, noteId)
      } else {
        const { error } = await supabase.from('notes').delete().eq('id', noteId).eq('user_id', userId)
        if (error) throw error
        touchedDecks.add(note.deck_id)
      }
      results.push({ noteId, ok: true, status: note.status, primaryText: getNotePrimaryText(note.fields ?? {}) })
    } catch (error) {
      results.push({ noteId, ok: false, error: errorMessage(error) })
    }
  }
  touchedDecks.forEach(revalidateDeck)
  return results
}
