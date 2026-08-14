import { describe, expect, it } from 'vitest'

import { getDraftFieldContract, validateDraftCandidate } from './draft-import'
import { mapFieldsToFlashcard } from './flashcard-mapping'

describe('Turkish deck integration', () => {
  it('exposes the Turkish universal draft contract', () => {
    const contract = getDraftFieldContract('turkish')
    expect(contract.requiredKeys).toEqual(['word', 'translation'])
    expect(contract.keys).toContain('examples_html')
  })

  it('validates and maps Turkish cards', () => {
    const candidate = validateDraftCandidate('turkish', {
      fields: {
        word: 'merhaba',
        translation: 'привет',
        part_of_speech: 'ifade',
        popularity: 10,
        examples_html: '<ul><li><b>Merhaba</b> arkadaşlar.</li></ul>',
      },
    })

    expect(candidate.errors).toEqual([])
    expect(candidate.candidate).toBeDefined()
    expect(mapFieldsToFlashcard(candidate.candidate!.fields, 'turkish')).toMatchObject({
      expression: 'merhaba',
      translation: 'привет',
      partOfSpeech: 'ifade',
      frequency: 10,
      examples: ['<b>Merhaba</b> arkadaşlar.'],
    })
  })
})
