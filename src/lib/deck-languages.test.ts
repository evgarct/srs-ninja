import { describe, expect, it } from 'vitest'

import {
  assertValidLanguagePair,
  getAvailableTranslationLanguages,
  isValidLanguagePair,
} from './deck-languages'

describe('deck language pairs', () => {
  it('allows Turkish decks translated into Russian', () => {
    expect(isValidLanguagePair('turkish', 'russian')).toBe(true)
    expect(() => assertValidLanguagePair('turkish', 'russian')).not.toThrow()
  })

  it('rejects identical study and translation languages', () => {
    expect(isValidLanguagePair('turkish', 'turkish')).toBe(false)
    expect(() => assertValidLanguagePair('turkish', 'turkish')).toThrow(
      'Deck and translation languages must be different'
    )
  })

  it('excludes the study language from translation choices', () => {
    expect(getAvailableTranslationLanguages('turkish')).toEqual(['russian', 'english', 'czech'])
  })
})
