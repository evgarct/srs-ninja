import { describe, expect, it } from 'vitest'

import { getNoteFormValues, getNotePrimaryText, normalizeNoteFields } from './note-fields'

describe('getNotePrimaryText', () => {
  it('prefers word over legacy expression and term', () => {
    expect(
      getNotePrimaryText({
        word: 'at the root of sth',
        expression: 'at the root of smth',
        term: 'root',
      })
    ).toBe('at the root of sth')
  })

  it('falls back to expression and term when word is missing', () => {
    expect(getNotePrimaryText({ expression: 'look up', term: 'lookup' })).toBe('look up')
    expect(getNotePrimaryText({ term: 'fallback term' })).toBe('fallback term')
  })
})

describe('normalizeNoteFields', () => {
  it('copies canonical primary text into legacy keys when they exist', () => {
    expect(
      normalizeNoteFields({
        word: 'at the root of sth',
        expression: 'at the root of smth',
        term: 'outdated term',
        translation: 'u korne',
      })
    ).toEqual({
      word: 'at the root of sth',
      expression: 'at the root of sth',
      term: 'at the root of sth',
      translation: 'u korne',
    })
  })

  it('keeps unrelated fields intact and backfills word from legacy keys', () => {
    expect(
      normalizeNoteFields({
        expression: 'carry on',
        translation: 'prodolzhat',
      })
    ).toEqual({
      word: 'carry on',
      expression: 'carry on',
      translation: 'prodolzhat',
    })
  })

  it('normalizes english notes into the canonical schema', () => {
    expect(
      normalizeNoteFields(
        {
          term: 'anchor',
          translation: 'якорь',
          frequency: '7',
          style: '🎓 Neutral / nautical',
          part_of_speech: 'NOUN',
          synonyms: 'hook\nmooring',
          antonyms: ['drift'],
          example_sentence: 'Drop the <b>anchor</b> before the storm.',
          example_translation: 'Брось <b>якорь</b> перед штормом.',
        },
        'english'
      )
    ).toEqual({
      word: 'anchor',
      translation: 'якорь',
      popularity: 7,
      style: 'neutral',
      part_of_speech: 'noun',
      synonyms: ['hook', 'mooring'],
      antonyms: ['drift'],
      examples_html: '<ul><li>Drop the <b>anchor</b> before the storm.</li><li>Брось <b>якорь</b> перед штормом.</li></ul>',
    })
  })
})

describe('getNoteFormValues', () => {
  it('projects english stored fields into editor values', () => {
    expect(
      getNoteFormValues('english', {
        word: 'anchor',
        translation: 'якорь',
        popularity: 7,
        style: 'neutral',
        synonyms: ['hook', 'mooring'],
        antonyms: ['drift'],
        examples_html: '<ul><li>Drop the <b>anchor</b>.</li><li>The <b>anchor</b> held.</li></ul>',
      })
    ).toEqual({
      word: 'anchor',
      translation: 'якорь',
      level: '',
      part_of_speech: '',
      popularity: '7',
      style: 'neutral',
      synonyms: 'hook\nmooring',
      antonyms: 'drift',
      examples_html: '<ul><li>Drop the <b>anchor</b>.</li><li>The <b>anchor</b> held.</li></ul>',
    })
  })
})
