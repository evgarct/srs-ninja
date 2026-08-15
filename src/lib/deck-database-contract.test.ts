import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { DECK_LANGUAGES } from './deck-languages'

const migration = readFileSync(
  new URL('../../supabase/migrations/20260815103325_allow_turkish_decks.sql', import.meta.url),
  'utf8'
)

describe('deck database language contract', () => {
  it('allows every supported study language in the database constraint', () => {
    for (const language of DECK_LANGUAGES) {
      expect(migration).toContain(`'${language}'`)
    }
  })
})
