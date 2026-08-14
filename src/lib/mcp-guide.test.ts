import { describe, expect, it } from 'vitest'
import { buildDeckContract, buildEchoGuide, getValidDraftExample } from '@/lib/mcp-guide'
import { validateDraftCandidate } from '@/lib/draft-import'

describe('MCP guide examples', () => {
  it.each(['english', 'czech', 'turkish'] as const)('builds a valid %s example', (language) => {
    expect(validateDraftCandidate(language, getValidDraftExample(language)).candidate).toBeDefined()
  })

  it('provides a self-contained save example without a real UUID', () => {
    const deck = { id: 'deck-1', name: 'Turkish A2', language: 'turkish', translation_language: 'russian' }
    expect(buildDeckContract(deck).saveExample).toMatchObject({ language: 'turkish', name: 'Turkish A2' })
    expect(JSON.stringify(buildEchoGuide(deck))).not.toContain('69b0bf5f')
  })
})
