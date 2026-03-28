import { describe, expect, it } from 'vitest'
import {
  canDeleteDraftBatch,
  createDraftConflictMetadata,
  findDuplicateDraftCandidates,
  findSimilarDraftCandidates,
  getDraftFieldContract,
  getDraftTextSimilarity,
  getImportBatchStatus,
  shouldAutoDeleteImportBatch,
  validateDraftCandidate,
} from '@/lib/draft-import'

describe('getDraftFieldContract', () => {
  it('returns the english field keys', () => {
    const contract = getDraftFieldContract('english')

    expect(contract.keys).toContain('word')
    expect(contract.keys).toContain('translation')
    expect(contract.keys).toContain('popularity')
    expect(contract.keys).toContain('examples_html')
    expect(contract.keys).not.toContain('gender')
  })

  it('returns the czech-only fields', () => {
    const contract = getDraftFieldContract('czech')

    expect(contract.keys).toContain('gender')
    expect(contract.keys).toContain('popularity')
    expect(contract.keys).toContain('examples_html')
    expect(contract.keys).toContain('verb_class')
    expect(contract.keys).toContain('note')
    expect(contract.keys).not.toContain('image_url')
  })
})

describe('validateDraftCandidate', () => {
  it('normalizes a valid english draft candidate', () => {
    const result = validateDraftCandidate('english', {
      fields: {
        word: ' anchor ',
        translation: 'якорь',
        part_of_speech: 'NOUN',
        level: 'b1',
        style: 'neutral',
        popularity: 6,
        synonyms: ['hook', 'Hook'],
        examples_html: '<ul><li>Drop the <b>anchor</b> before the storm.</li></ul>',
      },
      tags: [' nautical ', 'Nautical', 'travel'],
    })

    expect(result.errors).toEqual([])
    expect(result.candidate).toEqual({
      fields: {
        word: 'anchor',
        translation: 'якорь',
        part_of_speech: 'noun',
        level: 'B1',
        style: 'neutral',
        popularity: 6,
        synonyms: ['hook'],
        examples_html: '<ul><li>Drop the <b>anchor</b> before the storm.</li></ul>',
      },
      tags: ['nautical', 'travel'],
    })
  })

  it('rejects missing required fields', () => {
    const result = validateDraftCandidate('english', {
      fields: {
        translation: 'якорь',
      },
    })

    expect(result.candidate).toBeUndefined()
    expect(result.errors.some((error) => error.field === 'word')).toBe(true)
  })

  it('rejects invalid select values', () => {
    const result = validateDraftCandidate('czech', {
      fields: {
        word: 'kniha',
        translation: 'книга',
        gender: 'book',
      },
    })

    expect(result.candidate).toBeUndefined()
    expect(result.errors.some((error) => error.code === 'invalid_enum_value')).toBe(true)
  })

  it('warns and ignores unknown fields', () => {
    const result = validateDraftCandidate('english', {
      fields: {
        word: 'anchor',
        translation: 'якорь',
        frequency: '5',
      },
    })

    expect(result.errors).toEqual([])
    expect(result.warnings.some((warning) => warning.code === 'unknown_field')).toBe(true)
    expect(result.candidate?.fields.popularity).toBeUndefined()
  })

  it('keeps only canonical czech fields and warns on dropped legacy keys', () => {
    const result = validateDraftCandidate('czech', {
      fields: {
        word: 'kniha',
        translation: 'книга',
        level: 'b2',
        part_of_speech: 'существительное',
        popularity: '10',
        style: 'нейтральный',
        gender: 'женский',
        examples_html: '<ul><li>Čtu <b>knihu</b>.</li><li>Ta <b>kniha</b> je nová.</li></ul>',
        synonyms: ['том'],
        antonyms: ['журнал'],
        note: 'Базовое существительное.',
        notes: 'legacy note',
        frequency: '10',
      },
    })

    expect(result.candidate).toEqual({
      fields: {
        word: 'kniha',
        translation: 'книга',
        level: 'B2',
        part_of_speech: 'существительное',
        popularity: 10,
        style: 'нейтральный',
        gender: 'женский',
        examples_html: '<ul><li>Čtu <b>knihu</b>.</li><li>Ta <b>kniha</b> je nová.</li></ul>',
        synonyms: ['том'],
        antonyms: ['журнал'],
        note: 'Базовое существительное.',
      },
      tags: [],
    })
    expect(result.warnings.some((warning) => warning.field === 'notes')).toBe(true)
    expect(result.warnings.some((warning) => warning.field === 'frequency')).toBe(true)
  })
})

describe('findDuplicateDraftCandidates', () => {
  it('finds duplicates by normalized primary word', () => {
    const duplicates = findDuplicateDraftCandidates(
      [
        {
          id: 'note-1',
          fields: { word: 'Anchor' },
        },
      ],
      [
        {
          fields: { word: 'anchor', translation: 'якорь' },
          tags: [],
        },
      ]
    )

    expect(duplicates).toEqual([
      {
        index: 0,
        noteId: 'note-1',
        primaryText: 'Anchor',
      },
    ])
  })

  it('finds duplicates inside the same candidate batch', () => {
    const duplicates = findDuplicateDraftCandidates(
      [],
      [
        {
          fields: { word: 'anchor', translation: 'якорь' },
          tags: [],
        },
        {
          fields: { word: 'Anchor', translation: 'якорь' },
          tags: [],
        },
      ]
    )

    expect(duplicates).toEqual([
      {
        index: 1,
        noteId: 'candidate-0',
        primaryText: 'anchor',
      },
    ])
  })
})

describe('findSimilarDraftCandidates', () => {
  it('finds deterministic similar-note conflicts by primary text similarity', () => {
    const matches = findSimilarDraftCandidates(
      [
        {
          id: 'note-1',
          fields: { word: 'anchor' },
        },
      ],
      [
        {
          fields: { word: 'anchored', translation: 'закрепленный' },
          tags: [],
        },
      ]
    )

    expect(matches).toEqual([
      {
        index: 0,
        noteId: 'note-1',
        primaryText: 'anchor',
        similarityScore: expect.any(Number),
      },
    ])
    expect(matches[0]?.similarityScore).toBeGreaterThanOrEqual(0.75)
  })

  it('ignores candidates that are not similar enough', () => {
    const matches = findSimilarDraftCandidates(
      [
        {
          id: 'note-1',
          fields: { word: 'anchor' },
        },
      ],
      [
        {
          fields: { word: 'banana', translation: 'банан' },
          tags: [],
        },
      ]
    )

    expect(matches).toEqual([])
  })
})

describe('getDraftTextSimilarity', () => {
  it('normalizes punctuation, case, and accents before scoring', () => {
    expect(getDraftTextSimilarity('Ánchor!', 'anchor')).toBe(1)
  })
})

describe('createDraftConflictMetadata', () => {
  it('creates an open conflict payload for the draft review flow', () => {
    expect(
      createDraftConflictMetadata({
        index: 2,
        noteId: 'note-1',
        primaryText: 'anchor',
        similarityScore: 0.82,
      })
    ).toEqual({
      kind: 'similar_existing_note',
      matchedNoteId: 'note-1',
      matchedPrimaryText: 'anchor',
      similarityScore: 0.82,
      resolution: 'open',
    })
  })
})

describe('getImportBatchStatus', () => {
  it('returns draft when nothing is approved', () => {
    expect(getImportBatchStatus(['draft', 'draft'])).toBe('draft')
  })

  it('returns partially_approved for mixed statuses', () => {
    expect(getImportBatchStatus(['draft', 'approved'])).toBe('partially_approved')
  })

  it('returns approved when all notes are approved', () => {
    expect(getImportBatchStatus(['approved'])).toBe('approved')
  })
})

describe('canDeleteDraftBatch', () => {
  it('allows deleting batches that only contain draft notes', () => {
    expect(canDeleteDraftBatch(['draft', 'draft'])).toBe(true)
    expect(canDeleteDraftBatch([])).toBe(true)
  })

  it('blocks deleting batches once any note is approved', () => {
    expect(canDeleteDraftBatch(['draft', 'approved'])).toBe(false)
    expect(canDeleteDraftBatch(['approved'])).toBe(false)
  })
})

describe('shouldAutoDeleteImportBatch', () => {
  it('deletes batches with no remaining draft notes', () => {
    expect(shouldAutoDeleteImportBatch([])).toBe(true)
    expect(shouldAutoDeleteImportBatch(['approved'])).toBe(true)
    expect(shouldAutoDeleteImportBatch(['approved', 'approved'])).toBe(true)
  })

  it('keeps batches that still have draft notes', () => {
    expect(shouldAutoDeleteImportBatch(['draft'])).toBe(false)
    expect(shouldAutoDeleteImportBatch(['draft', 'approved'])).toBe(false)
  })
})
