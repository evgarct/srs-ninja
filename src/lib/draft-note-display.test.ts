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

  it('formats czech drafts into structured sections', () => {
    const state = getDraftNoteDisplayState(
      {
        word: 'běžet',
        translation: 'бежать',
        level: 'B1',
        part_of_speech: 'sloveso',
        popularity: 8,
        style: 'hovorový',
        gender: 'ženský',
        verb_class: '-it/-et/-ět',
        verb_irregular: 'běžím, běžíš',
        synonyms: ['utíkat'],
        antonyms: ['stát'],
        examples_html: '<ul><li>Ráno <b>běžím</b>.</li><li>Pes <b>běží</b>.</li></ul>',
        note: 'Нужно различать с utíkat.',
      },
      'czech'
    )

    expect(state.meta).toEqual([
      { key: 'level', label: 'Уровень', value: 'B1' },
      { key: 'part_of_speech', label: 'Тип', value: 'sloveso' },
      { key: 'popularity', label: 'Популярность', value: '8/10' },
      { key: 'style', label: 'Стиль', value: 'hovorový' },
      { key: 'gender', label: 'Род', value: 'ženský' },
      { key: 'verb_class', label: 'Спряжение', value: '-it/-et/-ět' },
    ])
    expect(state.lists).toEqual([
      { key: 'synonyms', label: 'Синонимы', values: ['utíkat'] },
      { key: 'antonyms', label: 'Антонимы', values: ['stát'] },
    ])
    expect(state.examples).toEqual(['Ráno <b>běžím</b>.', 'Pes <b>běží</b>.'])
    expect(state.fallback).toEqual([
      {
        key: 'note',
        label: 'Примечание',
        value: 'Спряжение: -it/-et/-ět • Исключения: běžím, běžíš • Нужно различать с utíkat.',
      },
    ])
  })
})
