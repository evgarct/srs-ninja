import { describe, expect, it } from 'vitest'

import {
  getReviewSessionCandidateLimit,
  selectReviewSessionCards,
} from './review-card-selection'

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
      sessionLimit: 20,
      orderCards: (cards) => cards.slice(0, 20),
    })

    expect(ordered).toHaveLength(25)
    expect(ordered).toEqual(rawCards)
  })

  it('keeps extra-study sessions untrimmed and unordered', () => {
    const rawCards = buildNewCards(8)
    const ordered = selectReviewSessionCards(rawCards, {
      isExtra: true,
      sessionLimit: 4,
      orderCards: () => [],
    })

    expect(ordered).toEqual(rawCards)
  })

  it('applies ordering before trimming the regular due session', () => {
    const rawCards = buildNewCards(4)
    const ordered = selectReviewSessionCards(rawCards, {
      sessionLimit: 2,
      orderCards: (cards) => [...cards].reverse(),
    })

    expect(ordered).toEqual([rawCards[3], rawCards[2]])
  })
})

describe('getReviewSessionCandidateLimit', () => {
  it('expands the fetch window beyond the visible session limit', () => {
    expect(getReviewSessionCandidateLimit(20)).toBe(80)
    expect(getReviewSessionCandidateLimit(200)).toBe(800)
  })
})
