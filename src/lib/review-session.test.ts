import { describe, expect, it } from 'vitest'

import {
  formatReviewInterval,
  getReviewPrefetchAudioUrls,
  prepareReviewSessionCards,
  type ReviewSessionCard,
} from './review-session'

const REVIEW_CARDS: ReviewSessionCard[] = [
  {
    id: 'card-1',
    note_id: 'note-1',
    card_type: 'recognition',
    state: 'new',
    stability: 0,
    difficulty: 0,
    elapsed_days: 0,
    scheduled_days: 0,
    reps: 0,
    lapses: 0,
    due_at: '2026-03-18T10:00:00.000Z',
    last_review: null,
    notes: {
      fields: {
        word: 'anchor',
        translation: 'якорь',
        level: 'A2',
        frequency: '6',
        style: 'Neutral',
        part_of_speech: 'noun',
      },
      tags: [],
      deck_id: 'deck-1',
    },
  },
  {
    id: 'card-2',
    note_id: 'note-2',
    card_type: 'production',
    state: 'review',
    stability: 12,
    difficulty: 6,
    elapsed_days: 2,
    scheduled_days: 6,
    reps: 4,
    lapses: 0,
    due_at: '2026-03-20T10:00:00.000Z',
    last_review: '2026-03-18T10:00:00.000Z',
    notes: {
      fields: {
        word: 'harbor',
        translation: 'гавань',
        level: 'B1',
        frequency: '5',
        style: 'Neutral',
        part_of_speech: 'noun',
      },
      tags: [],
      deck_id: 'deck-1',
    },
  },
  {
    id: 'card-3',
    note_id: 'note-1',
    card_type: 'recognition',
    state: 'review',
    stability: 9,
    difficulty: 5,
    elapsed_days: 1,
    scheduled_days: 4,
    reps: 3,
    lapses: 0,
    due_at: '2026-03-19T10:00:00.000Z',
    last_review: '2026-03-18T10:00:00.000Z',
    notes: {
      fields: {
        word: 'anchor',
        translation: 'якорь',
        level: 'A2',
        frequency: '6',
        style: 'Neutral',
        part_of_speech: 'noun',
      },
      tags: [],
      deck_id: 'deck-1',
    },
  },
]

describe('formatReviewInterval', () => {
  it('formats short and long intervals into compact labels', () => {
    expect(formatReviewInterval(1 / 24 / 120)).toBe('<1m')
    expect(formatReviewInterval(1 / 24 / 2)).toBe('30m')
    expect(formatReviewInterval(2)).toBe('2d')
    expect(formatReviewInterval(90)).toBe('3mo')
  })
})

describe('prepareReviewSessionCards', () => {
  it('prepares direction, flashcard props, intervals and audio upfront', () => {
    const prepared = prepareReviewSessionCards(
      REVIEW_CARDS,
      'english',
      {
        'note-1': 'https://cdn.test/anchor.mp3',
        'note-2': 'https://cdn.test/harbor.mp3',
      },
      new Date('2026-03-18T10:00:00.000Z')
    )

    expect(prepared).toHaveLength(3)
    expect(prepared[0]).toMatchObject({
      id: 'card-1',
      noteId: 'note-1',
      direction: 'recognition',
      audioUrl: 'https://cdn.test/anchor.mp3',
      flashcardProps: {
        expression: 'anchor',
        translation: 'якорь',
      },
    })
    expect(prepared[1].direction).toBe('production')
    expect(prepared[1].intervals.good).toMatch(/[mhdoy<]/)
  })
})

describe('getReviewPrefetchAudioUrls', () => {
  it('returns unique audio urls for the current card and lookahead window', () => {
    const prepared = prepareReviewSessionCards(
      REVIEW_CARDS,
      'english',
      {
        'note-1': 'https://cdn.test/anchor.mp3',
        'note-2': 'https://cdn.test/harbor.mp3',
      },
      new Date('2026-03-18T10:00:00.000Z')
    )

    expect(getReviewPrefetchAudioUrls(prepared, 0, 2)).toEqual([
      'https://cdn.test/anchor.mp3',
      'https://cdn.test/harbor.mp3',
    ])
    expect(getReviewPrefetchAudioUrls(prepared, 2, 2)).toEqual([
      'https://cdn.test/anchor.mp3',
    ])
  })
})
