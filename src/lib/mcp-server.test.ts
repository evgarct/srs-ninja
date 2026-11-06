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
