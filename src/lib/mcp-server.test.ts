import { describe, expect, it } from 'vitest'
import { buildToolErrorDiagnostic } from '@/lib/mcp-server'

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
