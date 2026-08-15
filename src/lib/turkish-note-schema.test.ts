import { describe, expect, it } from 'vitest'

import { getFields, normalizeNoteFields } from './note-fields'

describe('Turkish note schema', () => {
  it('uses the universal canonical field contract with Turkish parts of speech', () => {
    expect(getFields('turkish').map((field) => field.key)).toEqual([
      'word', 'translation', 'level', 'part_of_speech', 'popularity',
      'style', 'synonyms', 'antonyms', 'examples_html', 'usage_pattern', 'grammar_note',
    ])

    expect(normalizeNoteFields({
      word: 'kitap',
      translation: 'книга',
      part_of_speech: 'isim',
      frequency: 9,
      usage_pattern: 'birine yardım etmek',
      note: 'Yönelme hâli alır.',
    }, 'turkish')).toMatchObject({
      word: 'kitap',
      translation: 'книга',
      part_of_speech: 'isim',
      popularity: 9,
      usage_pattern: 'birine yardım etmek',
      grammar_note: 'Yönelme hâli alır.',
    })
  })

  it('accepts sayı and keeps legacy notes valid without optional grammar fields', () => {
    expect(normalizeNoteFields({ word: 'iki', translation: 'два', part_of_speech: 'sayı' }, 'turkish')).toEqual({
      word: 'iki', translation: 'два', part_of_speech: 'sayı',
    })
  })
})
