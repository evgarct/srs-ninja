import { describe, expect, it } from 'vitest'

import { getDraftNoteDisplayState } from './draft-note-display'

describe('getDraftNoteDisplayState', () => {
  it('formats english drafts into structured sections', () => {
    const state = getDraftNoteDisplayState(
      {
        word: 'anchor',
        translation: 'якорь',
        level: 'A2',
        part_of_speech: 'noun',
        popularity: 6,
        style: 'neutral',
        synonyms: ['hook', 'mooring'],
        antonyms: ['drift'],
        examples_html: '<ul><li>Drop the <b>anchor</b>.</li><li>The <b>anchor</b> held.</li></ul>',
        notes: 'Maritime vocabulary',
      },
      'english'
    )

    expect(state.meta).toEqual([
      { key: 'level', label: 'CEFR Level', value: 'A2' },
      { key: 'part_of_speech', label: 'Type', value: 'noun' },
      { key: 'popularity', label: 'Popularity', value: '6/10' },
      { key: 'style', label: 'Style', value: 'Neutral' },
    ])
    expect(state.lists).toEqual([
      { key: 'synonyms', label: 'Synonyms', values: ['hook', 'mooring'] },
      { key: 'antonyms', label: 'Antonyms', values: ['drift'] },
    ])
    expect(state.examples).toEqual([
      'Drop the <b>anchor</b>.',
      'The <b>anchor</b> held.',
    ])
    expect(state.fallback).toEqual([
      { key: 'notes', label: 'notes', value: 'Maritime vocabulary' },
    ])
  })

  it('falls back to generic key-value display for non-english drafts', () => {
    const state = getDraftNoteDisplayState(
      {
        word: 'konev',
        translation: 'лейка',
        example_sentence: 'Na zahradě jsme použili <b>konev</b>.',
      },
      'czech'
    )

    expect(state.meta).toEqual([])
    expect(state.lists).toEqual([])
    expect(state.examples).toEqual([])
    expect(state.fallback).toEqual([
      { key: 'word', label: 'Слово (чешский)', value: 'konev' },
      { key: 'translation', label: 'Перевод (рус/англ)', value: 'лейка' },
      { key: 'example_sentence', label: 'Пример (чешский)', value: 'Na zahradě jsme použili <b>konev</b>.' },
    ])
  })
})
