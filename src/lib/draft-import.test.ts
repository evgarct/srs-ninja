import { describe, expect, it } from 'vitest'
import {
  findDuplicateDraftCandidates,
  getDraftFieldContract,
  getImportBatchStatus,
  validateDraftCandidate,
} from '@/lib/draft-import'

describe('getDraftFieldContract', () => {
  it('returns the english field keys', () => {
    const contract = getDraftFieldContract('english')

    expect(contract.keys).toContain('word')
    expect(contract.keys).toContain('translation')
    expect(contract.keys).not.toContain('gender')
  })

  it('returns the czech-only fields', () => {
    const contract = getDraftFieldContract('czech')

    expect(contract.keys).toContain('gender')
    expect(contract.keys).toContain('frequency')
    expect(contract.keys).toContain('image_url')
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
        example_sentence: 'Drop the anchor before the storm.',
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
        example_sentence: 'Drop the anchor before the storm.',
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
    expect(result.candidate?.fields.frequency).toBeUndefined()
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
