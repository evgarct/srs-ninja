import { describe, expect, it } from 'vitest'

import {
  buildCzechFlashcardNote,
  formatCzechNoteMeta,
  getCzechNoteFormValues,
  normalizeCzechNoteFields,
} from './czech-note-schema'

describe('normalizeCzechNoteFields', () => {
  it('keeps only the new canonical Czech keys', () => {
    expect(
      normalizeCzechNoteFields({
        word: 'mluvit',
        translation: 'говорить',
        level: 'c1',
        part_of_speech: 'sloveso',
        popularity: '7',
        style: 'neutrální',
        synonyms: 'hovořit, povídat',
        antonyms: ['mlčet'],
        examples_html: '<ul><li>Musíme <b>mluvit</b> pomalu.</li><li>On rád <b>mluví</b> česky.</li></ul>',
        gender: 'ženský',
        verb_class: '-it/-et/-ět',
        verb_irregular: 'mluvím, mluvíš',
        note: 'Базовый частотный глагол.',
        expression: 'legacy',
        frequency: '3',
      })
    ).toEqual({
      word: 'mluvit',
      translation: 'говорить',
      level: 'C1',
      part_of_speech: 'sloveso',
      popularity: 7,
      style: 'neutrální',
      synonyms: ['hovořit', 'povídat'],
      antonyms: ['mlčet'],
      examples_html: '<ul><li>Musíme <b>mluvit</b> pomalu.</li><li>On rád <b>mluví</b> česky.</li></ul>',
      gender: 'ženský',
      verb_class: '-it/-et/-ět',
      verb_irregular: 'mluvím, mluvíš',
      note: 'Базовый частотный глагол.',
    })
  })
})

describe('getCzechNoteFormValues', () => {
  it('maps canonical stored values back into form fields', () => {
    expect(
      getCzechNoteFormValues({
        word: 'kniha',
        translation: 'книга',
        synonyms: ['том', 'издание'],
        antonyms: ['журнал'],
      })
    ).toEqual({
      word: 'kniha',
      translation: 'книга',
      level: '',
      part_of_speech: '',
      popularity: '',
      style: '',
      synonyms: 'том\nиздание',
      antonyms: 'журнал',
      examples_html: '',
      gender: '',
      verb_class: '',
      verb_irregular: '',
      note: '',
    })
  })
})

describe('formatCzechNoteMeta', () => {
  it('collects display-friendly czech metadata', () => {
    expect(
      formatCzechNoteMeta({
        level: 'B2',
        part_of_speech: 'podstatné jméno',
        popularity: 6,
        style: 'knižní',
        gender: 'ženský',
      })
    ).toEqual([
      { key: 'level', value: 'B2' },
      { key: 'part_of_speech', value: 'podstatné jméno' },
      { key: 'popularity', value: '6/10' },
      { key: 'style', value: 'knižní' },
      { key: 'gender', value: 'ženský' },
    ])
  })
})

describe('buildCzechFlashcardNote', () => {
  it('combines verb metadata and free-form note for review surfaces', () => {
    expect(
      buildCzechFlashcardNote({
        verb_class: '-ovat',
        verb_irregular: 'pracuji/pracuju',
        note: 'Разговорный вариант допустим.',
      })
    ).toBe('Спряжение: -ovat • Исключения: pracuji/pracuju • Разговорный вариант допустим.')
  })
})
