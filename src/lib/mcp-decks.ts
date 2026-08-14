import type { Language } from '@/lib/types'

export const MCP_DECK_LANGUAGES = ['czech', 'english', 'turkish'] as const satisfies readonly Language[]

export type DeckSelector = {
  deckId?: string
  language?: Language
  name?: string
}

export type McpDeck = {
  id: string
  name: string
  language: string
  translation_language: string
  description?: string | null
}

export type DeckResolution =
  | { ok: true; deck: McpDeck }
  | {
      ok: false
      code: 'DECK_SELECTOR_REQUIRED' | 'DECK_NOT_FOUND' | 'DECK_AMBIGUOUS'
      message: string
      candidates: McpDeck[]
    }

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

export function hasDeckSelector(selector: DeckSelector) {
  return Boolean(selector.deckId?.trim() || selector.language || selector.name?.trim())
}

export function resolveDeck(decks: McpDeck[], selector: DeckSelector): DeckResolution {
  if (!hasDeckSelector(selector)) {
    return {
      ok: false,
      code: 'DECK_SELECTOR_REQUIRED',
      message: 'Choose a deck by language, exact name, or deckId.',
      candidates: decks,
    }
  }

  const normalizedName = selector.name ? normalizeName(selector.name) : null
  const matches = decks.filter((deck) => {
    if (selector.deckId?.trim() && deck.id !== selector.deckId.trim()) return false
    if (selector.language && deck.language !== selector.language) return false
    if (normalizedName && normalizeName(deck.name) !== normalizedName) return false
    return true
  })

  if (matches.length === 1) return { ok: true, deck: matches[0] }
  if (matches.length === 0) {
    return {
      ok: false,
      code: 'DECK_NOT_FOUND',
      message: 'No owned deck matches this selector. Call list_decks and retry with language, exact name, or deckId.',
      candidates: decks,
    }
  }

  return {
    ok: false,
    code: 'DECK_AMBIGUOUS',
    message: 'More than one owned deck matches. Retry with the exact deck name or deckId.',
    candidates: matches,
  }
}

export function addAgentSelectors(decks: McpDeck[]) {
  const languageCounts = new Map<string, number>()
  for (const deck of decks) languageCounts.set(deck.language, (languageCounts.get(deck.language) ?? 0) + 1)

  return decks.map((deck) => {
    const isUniqueForLanguage = languageCounts.get(deck.language) === 1
    return {
      ...deck,
      isUniqueForLanguage,
      recommendedSelector: isUniqueForLanguage
        ? { language: deck.language }
        : { language: deck.language, name: deck.name },
    }
  })
}
