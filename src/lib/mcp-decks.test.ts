import { describe, expect, it } from 'vitest'
import { addAgentSelectors, resolveDeck, type McpDeck } from '@/lib/mcp-decks'

const decks: McpDeck[] = [
  { id: 'tr-1', name: 'Turkish A2', language: 'turkish', translation_language: 'russian' },
  { id: 'en-1', name: 'English Work', language: 'english', translation_language: 'russian' },
  { id: 'en-2', name: 'English Travel', language: 'english', translation_language: 'czech' },
]

describe('resolveDeck', () => {
  it('resolves a unique language without an id', () => {
    expect(resolveDeck(decks, { language: 'turkish' })).toMatchObject({ ok: true, deck: { id: 'tr-1' } })
  })

  it('normalizes exact deck names', () => {
    expect(resolveDeck(decks, { name: '  TURKISH   a2 ' })).toMatchObject({ ok: true, deck: { id: 'tr-1' } })
  })

  it('reports ambiguity with owned candidates', () => {
    expect(resolveDeck(decks, { language: 'english' })).toMatchObject({ ok: false, code: 'DECK_AMBIGUOUS', candidates: [{ id: 'en-1' }, { id: 'en-2' }] })
  })

  it('does not use fuzzy name matching', () => {
    expect(resolveDeck(decks, { name: 'Turkish' })).toMatchObject({ ok: false, code: 'DECK_NOT_FOUND' })
  })
})

describe('addAgentSelectors', () => {
  it('uses language only when it is unique', () => {
    const result = addAgentSelectors(decks)
    expect(result[0]).toMatchObject({ isUniqueForLanguage: true, recommendedSelector: { language: 'turkish' } })
    expect(result[1]).toMatchObject({ isUniqueForLanguage: false, recommendedSelector: { language: 'english', name: 'English Work' } })
  })
})
