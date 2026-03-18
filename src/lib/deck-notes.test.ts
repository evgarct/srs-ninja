import { describe, expect, it } from 'vitest'

import {
  filterDeckNotes,
  getAllDeckTags,
  getNoteFsrsState,
  getNoteMemoryScore,
  isFsrsState,
  type AudioFilter,
  type DeckNoteRow,
} from './deck-notes'

const SAMPLE_NOTES: DeckNoteRow[] = [
  {
    id: 'note-1',
    fields: { word: 'anchor', translation: 'якорь' },
    tags: ['ENGLISH::travel', 'basics'],
    cards: [
      { id: 'c1', card_type: 'recognition', state: 'review', stability: 28 },
      { id: 'c2', card_type: 'production', state: 'learning', stability: 5 },
    ],
  },
  {
    id: 'note-2',
    fields: { word: 'harbor', translation: 'гавань' },
    tags: ['ENGLISH::travel', 'advanced'],
    cards: [
      { id: 'c3', card_type: 'recognition', state: 'review', stability: 18 },
      { id: 'c4', card_type: 'production', state: 'review', stability: 24 },
    ],
  },
  {
    id: 'note-3',
    fields: { word: 'storm', translation: 'шторм' },
    tags: ['weather'],
    cards: [
      { id: 'c5', card_type: 'recognition', state: 'relearning', stability: 2 },
    ],
  },
]

describe('isFsrsState', () => {
  it('accepts supported FSRS states and rejects unknown values', () => {
    expect(isFsrsState('new')).toBe(true)
    expect(isFsrsState('learning')).toBe(true)
    expect(isFsrsState('relearning')).toBe(true)
    expect(isFsrsState('review')).toBe(true)
    expect(isFsrsState('due')).toBe(false)
    expect(isFsrsState('')).toBe(false)
  })
})

describe('getNoteFsrsState', () => {
  it('uses pessimistic priority across all cards in a note', () => {
    expect(getNoteFsrsState(SAMPLE_NOTES[0].cards)).toBe('learning')
    expect(getNoteFsrsState(SAMPLE_NOTES[1].cards)).toBe('review')
    expect(getNoteFsrsState(SAMPLE_NOTES[2].cards)).toBe('relearning')
  })

  it('falls back to new when cards are missing or invalid', () => {
    expect(getNoteFsrsState([])).toBe('new')
    expect(
      getNoteFsrsState([{ id: 'x', card_type: 'recognition', state: 'unknown' }])
    ).toBe('new')
  })
})

describe('getAllDeckTags', () => {
  it('returns unique sorted tags from all notes', () => {
    expect(getAllDeckTags(SAMPLE_NOTES)).toEqual([
      'advanced',
      'basics',
      'ENGLISH::travel',
      'weather',
    ])
  })
})

describe('filterDeckNotes', () => {
  it('keeps notes that match all selected tags', () => {
    const result = filterDeckNotes(SAMPLE_NOTES, {
      tagFilters: ['ENGLISH::travel', 'basics'],
    })

    expect(result.map((note) => note.id)).toEqual(['note-1'])
  })

  it('keeps notes that match any selected FSRS aggregate state', () => {
    const result = filterDeckNotes(SAMPLE_NOTES, {
      stateFilters: ['review', 'relearning'],
    })

    expect(result.map((note) => note.id)).toEqual(['note-2', 'note-3'])
  })

  it('combines tag and state filters together', () => {
    const result = filterDeckNotes(SAMPLE_NOTES, {
      tagFilters: ['ENGLISH::travel'],
      stateFilters: ['review'],
    })

    expect(result.map((note) => note.id)).toEqual(['note-2'])
  })

  it.each<[AudioFilter, string[]]>([
    ['with_audio', ['note-1', 'note-3']],
    ['without_audio', ['note-2']],
  ])('filters notes by audio availability for %s', (audioFilter, expectedIds) => {
    const result = filterDeckNotes(
      SAMPLE_NOTES,
      { audioFilter },
      {
        'note-1': 'https://cdn.test/anchor.mp3',
        'note-3': 'https://cdn.test/storm.mp3',
      }
    )

    expect(result.map((note) => note.id)).toEqual(expectedIds)
  })
})

describe('getNoteMemoryScore', () => {
  it('returns higher scores for stronger review cards', () => {
    expect(getNoteMemoryScore(SAMPLE_NOTES[1].cards)).toBeGreaterThan(
      getNoteMemoryScore(SAMPLE_NOTES[0].cards) ?? 0
    )
  })

  it('returns null when note has no cards', () => {
    expect(getNoteMemoryScore([])).toBeNull()
  })
})
