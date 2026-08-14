import { describe, expect, it } from 'vitest'

import { getFields, normalizeNoteFields } from './note-fields'

describe('Turkish note schema', () => {
  it('uses the universal canonical field contract with Turkish parts of speech', () => {
    expect(getFields('turkish').map((field) => field.key)).toEqual([
      'word', 'translation', 'level', 'part_of_speech', 'popularity',
      'style', 'synonyms', 'antonyms', 'examples_html',
    ])

    expect(normalizeNoteFields({
      word: 'kitap',
      translation: 'книга',
      part_of_speech: 'isim',
      frequency: 9,
    }, 'turkish')).toMatchObject({
      word: 'kitap',
      translation: 'книга',
      part_of_speech: 'isim',
      popularity: 9,
    })
  })
})
