import { describe, expect, it } from 'vitest'

import { selectReviewSessionCards } from './review-card-selection'

type TestCard = {
  id: string
  note_id: string
  card_type: string
  state: string
}

function buildNewCards(count: number): TestCard[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `card-${index + 1}`,
    note_id: `note-${index + 1}`,
    card_type: 'recognition',
    state: 'new',
  }))
}

describe('selectReviewSessionCards', () => {
  it('keeps manual sessions untrimmed and bypasses due-card ordering', () => {
    const rawCards = buildNewCards(25)
    const ordered = selectReviewSessionCards(rawCards, {
      isManual: true,
      orderCards: (cards) => cards.slice(0, 20),
    })

    expect(ordered).toHaveLength(25)
    expect(ordered).toEqual(rawCards)
  })

  it('keeps extra-study sessions untrimmed and unordered', () => {
    const rawCards = buildNewCards(8)
    const ordered = selectReviewSessionCards(rawCards, {
      isExtra: true,
      orderCards: () => [],
    })

    expect(ordered).toEqual(rawCards)
  })

  it('still applies due-card ordering for normal review sessions', () => {
    const rawCards = buildNewCards(25)
    const ordered = selectReviewSessionCards(rawCards, {
      orderCards: (cards) => cards.slice(0, 20),
    })

    expect(ordered).toHaveLength(20)
  })
})
