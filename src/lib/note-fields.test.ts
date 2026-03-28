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
  it('keeps legacy primary keys readable via getNotePrimaryText', () => {
    expect(
      getNotePrimaryText({
        word: 'at the root of sth',
        expression: 'at the root of smth',
        term: 'outdated term',
      })
    ).toBe('at the root of sth')
  })

  it('normalizes english notes with legacy input into the canonical schema', () => {
    expect(
      normalizeNoteFields(
        {
          expression: 'carry on',
          translation: 'продолжать',
        },
        'english'
      )
    ).toEqual({
      word: 'carry on',
      translation: 'продолжать',
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

  it('normalizes czech notes into the new canonical schema and drops legacy keys', () => {
    expect(
      normalizeNoteFields(
        {
          word: 'kniha',
          translation: 'книга',
          level: 'B1',
          part_of_speech: 'существительное',
          popularity: '11',
          style: 'нейтральный',
          synonyms: 'том, издание',
          antonyms: ['журнал'],
          examples_html: '<ul><li>Čtu <b>knihu</b>.</li><li>Ta <b>kniha</b> je nová.</li></ul>',
          gender: 'женский',
          verb_class: '-at',
          verb_irregular: 'legacy should stay only if filled',
          note: 'Базовое существительное.',
          frequency: '4',
          example_sentence: 'old example',
        },
        'czech'
      )
    ).toEqual({
      word: 'kniha',
      translation: 'книга',
      level: 'B1',
      part_of_speech: 'существительное',
      popularity: 10,
      style: 'нейтральный',
      synonyms: ['том', 'издание'],
      antonyms: ['журнал'],
      examples_html: '<ul><li>Čtu <b>knihu</b>.</li><li>Ta <b>kniha</b> je nová.</li></ul>',
      gender: 'женский',
      verb_class: '-at',
      verb_irregular: 'legacy should stay only if filled',
      note: 'Базовое существительное.',
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

  it('projects czech stored fields into editor values', () => {
    expect(
      getNoteFormValues('czech', {
        word: 'běžet',
        translation: 'бежать',
        level: 'B1',
        part_of_speech: 'глагол',
        popularity: 8,
        style: 'разговорный',
        synonyms: ['utíkat', 'klusat'],
        antonyms: ['stát'],
        examples_html: '<ul><li>Ráno <b>běžím</b> do práce.</li><li>Pes <b>běží</b> za míčem.</li></ul>',
        verb_class: '-it/-et/-ět',
        verb_irregular: 'běžím, běžíš',
        note: 'Часто используется в разговорной речи.',
      })
    ).toEqual({
      word: 'běžet',
      translation: 'бежать',
      level: 'B1',
      part_of_speech: 'глагол',
      popularity: '8',
      style: 'разговорный',
      synonyms: 'utíkat\nklusat',
      antonyms: 'stát',
      examples_html: '<ul><li>Ráno <b>běžím</b> do práce.</li><li>Pes <b>běží</b> za míčem.</li></ul>',
      gender: '',
      verb_class: '-it/-et/-ět',
      verb_irregular: 'běžím, běžíš',
      note: 'Часто используется в разговорной речи.',
    })
  })
})
