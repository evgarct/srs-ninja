import { getNotePrimaryText, normalizeNoteFields } from '@/lib/note-fields'
import { normalizeNoteTags } from '@/lib/note-tags'
import { validateDraftCandidate, type DraftValidationIssue } from '@/lib/draft-import'
import { getNoteFsrsState, type DeckNoteCard, type FsrsState } from '@/lib/deck-notes'
import type { Language } from '@/lib/types'

export type NoteStatusFilter = 'approved' | 'draft' | 'all'

export interface TagEdit {
  setTags?: string[]
  addTags?: string[]
  removeTags?: string[]
}

export interface NoteUpdateInput extends TagEdit {
  noteId: string
  fields?: Record<string, unknown>
}

export interface PreparedNoteUpdate {
  fields: Record<string, unknown>
  tags: string[]
  primaryTextChanged: boolean
  errors: DraftValidationIssue[]
}

/**
 * Applies a tag edit: setTags replaces the list, then addTags/removeTags apply on top.
 * Comparison for removal is case-insensitive, like tag de-duplication in normalizeNoteTags.
 */
export function applyTagEdit(current: string[], edit: TagEdit): string[] {
  const base = edit.setTags ? edit.setTags : current
  const removed = new Set((edit.removeTags ?? []).map((tag) => tag.trim().toLowerCase()))
  return normalizeNoteTags([...base, ...(edit.addTags ?? [])].filter((tag) => !removed.has(tag.trim().toLowerCase())))
}

export function hasTagEdit(edit: TagEdit) {
  return Boolean(edit.setTags || edit.addTags?.length || edit.removeTags?.length)
}

/**
 * Merges a partial field patch into the stored fields, normalizes them with the same
 * code the web editor uses, and validates the result against the deck contract.
 * A field set to an empty string is cleared.
 */
export function prepareNoteUpdate(
  language: Language,
  existing: { fields: Record<string, unknown>; tags: string[] },
  update: Omit<NoteUpdateInput, 'noteId'>
): PreparedNoteUpdate {
  const merged = update.fields ? { ...existing.fields, ...update.fields } : existing.fields
  const fields = normalizeNoteFields(merged, language)
  const tags = hasTagEdit(update) ? applyTagEdit(existing.tags, update) : normalizeNoteTags(existing.tags)
  // Only issues in the patched fields (or a missing primary text) block the edit, so legacy
  // notes that predate a required field can still be edited elsewhere.
  const patchedKeys = new Set(Object.keys(update.fields ?? {}))
  const primaryText = getNotePrimaryText(fields)
  const errors = update.fields
    ? validateDraftCandidate(language, { fields: merged, tags }).errors.filter((issue) =>
        (issue.field && patchedKeys.has(issue.field)) || (!primaryText && issue.message.includes('primary')))
    : []
  return {
    fields,
    tags,
    primaryTextChanged: primaryText !== getNotePrimaryText(existing.fields),
    errors,
  }
}

function foldText(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

/** True when any string field of the note contains the query (case- and diacritic-insensitive). */
export function noteMatchesQuery(fields: Record<string, unknown>, query: string | undefined) {
  const needle = query?.trim()
  if (!needle) return true
  const folded = foldText(needle)
  return Object.values(fields).some((value) => typeof value === 'string' && foldText(value).includes(folded))
}

export interface ManagedNoteRow {
  id: string
  deck_id: string
  status: string
  fields: Record<string, unknown>
  tags: string[] | null
  import_batch_id: string | null
  created_at?: string
  updated_at?: string
  cards?: DeckNoteCard[] | null
}

export interface NoteListFilters {
  tags?: string[]
  states?: FsrsState[]
  query?: string
}

/** Shapes a stored note for MCP output: compact cards and a single memory state like the deck page. */
export function toManagedNote(note: ManagedNoteRow, audioUrl?: string | null) {
  const cards = note.cards ?? []
  return {
    hasAudio: Boolean(audioUrl),
    audioUrl: audioUrl ?? null,
    noteId: note.id,
    deckId: note.deck_id,
    status: note.status,
    primaryText: getNotePrimaryText(note.fields ?? {}),
    fields: note.fields ?? {},
    tags: note.tags ?? [],
    importBatchId: note.import_batch_id,
    state: note.status === 'approved' ? getNoteFsrsState(cards) : null,
    cards: cards.map((card) => ({ cardId: card.id, direction: card.card_type, state: card.state, dueAt: card.due_at ?? null })),
    createdAt: note.created_at ?? null,
    updatedAt: note.updated_at ?? null,
  }
}

export function filterManagedNotes(notes: ManagedNoteRow[], filters: NoteListFilters) {
  const tags = filters.tags ?? []
  const states = new Set(filters.states ?? [])
  return notes.filter((note) => {
    const noteTags = note.tags ?? []
    const matchesTags = tags.every((tag) => noteTags.some((noteTag) => noteTag.toLowerCase() === tag.trim().toLowerCase()))
    const matchesState = states.size === 0 || (note.status === 'approved' && states.has(getNoteFsrsState(note.cards ?? [])))
    return matchesTags && matchesState && noteMatchesQuery(note.fields ?? {}, filters.query)
  })
}
