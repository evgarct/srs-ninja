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
        part_of_speech: 'глагол',
        popularity: '7',
        style: 'нейтральный',
        synonyms: 'hovořit, povídat',
        antonyms: ['mlčet'],
        examples_html: '<ul><li>Musíme <b>mluvit</b> pomalu.</li><li>On rád <b>mluví</b> česky.</li></ul>',
        gender: 'женский',
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
      part_of_speech: 'глагол',
      popularity: 7,
      style: 'нейтральный',
      synonyms: ['hovořit', 'povídat'],
      antonyms: ['mlčet'],
      examples_html: '<ul><li>Musíme <b>mluvit</b> pomalu.</li><li>On rád <b>mluví</b> česky.</li></ul>',
      gender: 'женский',
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
        part_of_speech: 'существительное',
        popularity: 6,
        style: 'книжный',
        gender: 'женский',
      })
    ).toEqual([
      { key: 'level', value: 'B2' },
      { key: 'part_of_speech', value: 'существительное' },
      { key: 'popularity', value: '6/10' },
      { key: 'style', value: 'книжный' },
      { key: 'gender', value: 'женский' },
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
