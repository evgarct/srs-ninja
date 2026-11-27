import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const draftService = vi.hoisted(() => ({
  deleteDraftNoteForUser: vi.fn(),
  approveDraftNoteForUser: vi.fn(),
  approveDraftBatchForUser: vi.fn(),
  resolveDraftConflictForUser: vi.fn(),
  applyDraftConflictToExistingNoteForUser: vi.fn(),
}))
vi.mock('@/lib/draft-import-service', () => draftService)
vi.mock('@/lib/tts', () => ({ generateAndCacheAudio: vi.fn() }))

import { deleteNotesForUser, editNoteTagsForUser, updateNotesForUser } from '@/lib/note-management-service'

type Row = { id: string; deck_id: string; status: string; fields: Record<string, unknown>; tags: string[]; import_batch_id: string | null; cards: [] }

/** Minimal chainable Supabase fake: records updates/deletes on notes and answers selects. */
function fakeSupabase(notes: Row[]) {
  const writes: Array<{ op: string; values?: unknown; filters: Record<string, unknown> }> = []
  const client = {
    from(table: string) {
      const filters: Record<string, unknown> = {}
      let op = 'select'
      let values: unknown
      const builder = {
        select: () => builder,
        update: (next: unknown) => { op = 'update'; values = next; return builder },
        delete: () => { op = 'delete'; return builder },
        eq: (column: string, value: unknown) => { filters[column] = value; return builder },
        in: (column: string, list: unknown[]) => { filters[column] = list; return builder },
        then(resolve: (value: unknown) => unknown) {
          if (op !== 'select') { writes.push({ op, values, filters: { ...filters } }); return Promise.resolve({ error: null }).then(resolve) }
          if (table === 'decks') return Promise.resolve({ data: [{ id: 'deck-cz', language: 'czech' }], error: null }).then(resolve)
          const ids = (filters.id as string[]) ?? []
          return Promise.resolve({ data: notes.filter((note) => ids.includes(note.id)), error: null }).then(resolve)
        },
      }
      return builder
    },
  }
  return { client: client as unknown as SupabaseClient, writes }
}

const draft: Row = { id: 'd1', deck_id: 'deck-cz', status: 'draft', fields: { word: 'nit', translation: 'нитка' }, tags: ['lekce'], import_batch_id: 'b1', cards: [] }
const approved: Row = { id: 'a1', deck_id: 'deck-cz', status: 'approved', fields: { word: 'jehla', translation: 'игла' }, tags: [], import_batch_id: null, cards: [] }

beforeEach(() => vi.clearAllMocks())

describe('deleteNotesForUser', () => {
  it('routes drafts through the drafts service and deletes approved notes directly', async () => {
    const { client, writes } = fakeSupabase([draft, approved])
    const results = await deleteNotesForUser(client, 'user-1', ['d1', 'a1', 'missing'])

    expect(draftService.deleteDraftNoteForUser).toHaveBeenCalledWith(client, 'user-1', 'd1')
    expect(writes).toEqual([{ op: 'delete', values: undefined, filters: { id: 'a1', user_id: 'user-1' } }])
    expect(results.map((result) => result.ok)).toEqual([true, true, false])
  })
})

describe('updateNotesForUser', () => {
  it('writes merged fields and tags for a valid patch', async () => {
    const { client, writes } = fakeSupabase([draft])
    const [result] = await updateNotesForUser(client, 'user-1', [{ noteId: 'd1', fields: { translation: 'нить' }, addTags: ['rukodělné práce'] }])

    expect(result.ok).toBe(true)
    expect(writes).toHaveLength(1)
    expect(writes[0].values).toMatchObject({ fields: { word: 'nit', translation: 'нить' }, tags: ['lekce', 'rukodělné práce'] })
  })

  it('does not write when the patch fails validation', async () => {
    const { client, writes } = fakeSupabase([draft])
    const [result] = await updateNotesForUser(client, 'user-1', [{ noteId: 'd1', fields: { word: '' } }])
    expect(result.ok).toBe(false)
    expect(writes).toEqual([])
  })
})

describe('editNoteTagsForUser', () => {
  it('updates only tags', async () => {
    const { client, writes } = fakeSupabase([draft, approved])
    await editNoteTagsForUser(client, 'user-1', ['d1', 'a1'], { setTags: ['rukodělné práce'] })
    expect(writes.map((write) => write.values)).toEqual([{ tags: ['rukodělné práce'] }, { tags: ['rukodělné práce'] }])
  })
})
