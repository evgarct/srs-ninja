import { describe, expect, it } from 'vitest'

import { countVisibleDueCardsByDeck, getStartOfDayInTimeZone } from './dashboard-review'

describe('countVisibleDueCardsByDeck', () => {
  it('hides cards that were already reviewed today from the dashboard review CTA', () => {
    const counts = countVisibleDueCardsByDeck(
      [
        { id: 'c1', deckId: 'deck-1' },
        { id: 'c2', deckId: 'deck-1' },
        { id: 'c3', deckId: 'deck-2' },
      ],
      ['c2', 'c3']
    )

    expect(counts.get('deck-1')).toBe(1)
    expect(counts.get('deck-2')).toBeUndefined()
  })
})

describe('getStartOfDayInTimeZone', () => {
  it('returns the UTC timestamp for the local midnight in the requested time zone', () => {
    const start = getStartOfDayInTimeZone(new Date('2026-03-18T12:00:00.000Z'), 'Europe/Prague')

    expect(start.toISOString()).toBe('2026-03-17T23:00:00.000Z')
  })
})
