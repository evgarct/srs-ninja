import { describe, expect, it, vi } from 'vitest'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { buildToolErrorDiagnostic, createEchoMcpServer, toTextResult, toToolError } from '@/lib/mcp-server'

const reviewService = vi.hoisted(() => ({
  getDueCardsForUser: vi.fn(),
  getManualStudyCardsForUser: vi.fn(),
  submitReviewForUser: vi.fn(),
}))

vi.mock('@/lib/review-service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/review-service')>()),
  ...reviewService,
}))

const noteService = vi.hoisted(() => ({
  listNotesForUser: vi.fn(),
  getNoteForUser: vi.fn(),
  updateNotesForUser: vi.fn(),
  editNoteTagsForUser: vi.fn(),
  resolveNoteIdsForUser: vi.fn(),
  approveDraftsForUser: vi.fn(),
  resolveDraftConflictsForUser: vi.fn(),
  deleteNotesForUser: vi.fn(),
}))

vi.mock('@/lib/note-management-service', () => noteService)

const czechDeck = { id: 'deck-cz', name: 'CZ', language: 'czech', translation_language: 'russian', description: null }

function fakeSupabase(decks: unknown[]) {
  const query = { select: () => query, eq: () => query, order: async () => ({ data: decks, error: null }) }
  return { from: () => query } as unknown as SupabaseClient<Database>
}

async function connectClient() {
  const server = createEchoMcpServer({ supabase: fakeSupabase([czechDeck]), userId: 'user-1' })
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const client = new Client({ name: 'test-client', version: '0.0.0' })
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])
  return client
}

function textOf(result: Awaited<ReturnType<Client['callTool']>>) {
  return (result.content as { type: string; text: string }[]).map((part) => part.text).join('\n')
}

describe('tool result text content', () => {
  it('mirrors structuredContent as JSON after the summary', () => {
    const result = toTextResult('Found 1 deck.', { decks: [{ id: 'deck-1' }] })
    expect(result.content[0].text).toBe('Found 1 deck.\n\n{"decks":[{"id":"deck-1"}]}')
    expect(result.structuredContent).toEqual({ decks: [{ id: 'deck-1' }] })
  })

  it('keeps plain text when there is no payload', () => {
    expect(toTextResult('Echo guide.').content[0].text).toBe('Echo guide.')
  })

  it('mirrors error payloads too', () => {
    const result = toToolError('Rating must be again, hard, good, easy or 1-4.', { code: 'INVALID_RATING' })
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('"code":"INVALID_RATING"')
  })
})

describe('get_review_session over MCP', () => {
  it('puts every card with its cardId, question and answer into the text content', async () => {
    reviewService.getDueCardsForUser.mockResolvedValue([
      { id: 'card-1', note_id: 'note-1', card_type: 'production', state: 'review', due_at: '2026-11-01T00:00:00Z', notes: { fields: { word: 'jablko', translation: 'яблоко' } } },
      { id: 'card-2', note_id: 'note-2', card_type: 'recognition', state: 'review', due_at: '2026-11-01T00:00:00Z', notes: { fields: { word: 'cesta', translation: 'путь' } } },
    ])
    const client = await connectClient()

    const result = await client.callTool({ name: 'get_review_session', arguments: { language: 'czech', mode: 'due', limit: 20 } })
    const text = textOf(result)

    expect(result.isError).toBeFalsy()
    expect(text).toContain('Review session for CZ: 1 of 1 matching cards.')
    const payload = JSON.parse(text.slice(text.indexOf('{')))
    expect(payload.cards).toHaveLength(1)
    expect(payload.cards[0]).toMatchObject({ cardId: 'card-1', question: 'яблоко', answer: 'jablko', acceptedAnswers: ['jablko'] })
    expect(payload.instructions.join(' ')).toContain('submit_review')
  })
})

describe('note management tools over MCP', () => {
  it('publishes the full management tool set', async () => {
    const client = await connectClient()
    const names = (await client.listTools()).tools.map((tool) => tool.name)
    expect(names).toEqual(expect.arrayContaining(['list_notes', 'get_note', 'update_notes', 'edit_note_tags', 'approve_drafts', 'resolve_draft_conflict', 'delete_notes', 'delete_draft_batch']))
    const destructive = (await client.listTools()).tools.filter((tool) => tool.annotations?.destructiveHint).map((tool) => tool.name)
    expect(destructive).toEqual(expect.arrayContaining(['delete_notes', 'delete_draft_batch']))
  })

  it('edits tags of a whole draft batch by batchId', async () => {
    noteService.resolveNoteIdsForUser.mockResolvedValue(['n1', 'n2'])
    noteService.editNoteTagsForUser.mockResolvedValue([{ noteId: 'n1', ok: true, tags: ['rukodělné práce'] }, { noteId: 'n2', ok: true, tags: ['rukodělné práce'] }])
    const client = await connectClient()

    const result = await client.callTool({ name: 'edit_note_tags', arguments: { batchId: 'batch-1', addTags: ['rukodělné práce'], removeTags: ['lekce'] } })

    expect(result.isError).toBeFalsy()
    expect(noteService.resolveNoteIdsForUser).toHaveBeenCalledWith(expect.anything(), 'user-1', { noteIds: undefined, batchId: 'batch-1' })
    expect(noteService.editNoteTagsForUser).toHaveBeenCalledWith(expect.anything(), 'user-1', ['n1', 'n2'], { addTags: ['rukodělné práce'], removeTags: ['lekce'] })
    expect(textOf(result)).toContain('Updated tags on 2 notes, 0 failed.')
  })

  it('refuses a tag edit without a selection or a change', async () => {
    const client = await connectClient()
    expect((await client.callTool({ name: 'edit_note_tags', arguments: { addTags: ['x'] } })).isError).toBe(true)
    expect((await client.callTool({ name: 'edit_note_tags', arguments: { batchId: 'b' } })).isError).toBe(true)
  })

  it('reports per-item failures from update_notes', async () => {
    noteService.updateNotesForUser.mockResolvedValue([{ noteId: 'n1', ok: true }, { noteId: 'n2', ok: false, error: 'Note not found' }])
    const client = await connectClient()
    const result = await client.callTool({ name: 'update_notes', arguments: { items: [{ noteId: 'n1', fields: { translation: 'x' } }, { noteId: 'n2', addTags: ['y'] }] } })
    expect(textOf(result)).toContain('Updated 1 notes, 1 failed.')
  })

  it('requires confirm: true to delete notes', async () => {
    noteService.deleteNotesForUser.mockResolvedValue([{ noteId: 'n1', ok: true }])
    const client = await connectClient()
    const refused = await client.callTool({ name: 'delete_notes', arguments: { noteIds: ['n1'] } })
    expect(refused.isError).toBe(true)
    expect(noteService.deleteNotesForUser).not.toHaveBeenCalled()
    const done = await client.callTool({ name: 'delete_notes', arguments: { noteIds: ['n1'], confirm: true } })
    expect(done.isError).toBeFalsy()
    expect(noteService.deleteNotesForUser).toHaveBeenCalledWith(expect.anything(), 'user-1', ['n1'])
  })
})

describe('buildToolErrorDiagnostic', () => {
  it('preserves plain Error messages and context', () => {
    const diagnostic = buildToolErrorDiagnostic(new Error('Deck not found'), 'Fallback message', {
      tool: 'save_draft_notes',
      deckId: 'deck-1',
      itemCount: 2,
    })

    expect(diagnostic).toMatchObject({
      message: 'Deck not found',
      errorType: 'Error',
      tool: 'save_draft_notes',
      deckId: 'deck-1',
      itemCount: 2,
    })
  })

  it('surfaces code, details, and hint from structured backend errors', () => {
    const diagnostic = buildToolErrorDiagnostic(
      {
        name: 'PostgrestError',
        message: 'new row violates row-level security policy',
        code: '42501',
        details: 'insert on table "notes" violates policy',
        hint: 'Check user ownership for the target deck.',
      },
      'Fallback message',
      {
        tool: 'save_draft_notes',
        deckId: 'deck-english',
        itemCount: 1,
      }
    )

    expect(diagnostic).toMatchObject({
      message: 'new row violates row-level security policy',
      errorType: 'PostgrestError',
      code: '42501',
      details: 'insert on table "notes" violates policy',
      hint: 'Check user ownership for the target deck.',
      tool: 'save_draft_notes',
      deckId: 'deck-english',
      itemCount: 1,
    })
  })
})
