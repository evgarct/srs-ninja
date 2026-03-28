import { describe, expect, it } from 'vitest'

import { mapFieldsToFlashcard } from './flashcard-mapping'

describe('mapFieldsToFlashcard', () => {
  it('maps canonical note fields into flashcard props for english notes', () => {
    expect(
      mapFieldsToFlashcard(
        {
          word: 'anchor',
          translation: 'якорь',
          examples_html: '<ul><li>Drop the <b>anchor</b>.</li><li>The <b>anchor</b> held.</li></ul>',
          level: 'A2',
          popularity: 7.2,
          style: 'neutral',
          part_of_speech: 'noun',
          image_url: 'https://example.com/anchor.png',
          synonyms: ['hook'],
          antonyms: ['drift'],
        },
        'english'
      )
    ).toEqual({
      expression: 'anchor',
      translation: 'якорь',
      examples: ['Drop the <b>anchor</b>.', 'The <b>anchor</b> held.'],
      level: 'A2',
      partOfSpeech: 'noun',
      gender: undefined,
      frequency: 7,
      style: 'Neutral',
      note: undefined,
      imageUrl: 'https://example.com/anchor.png',
      synonyms: ['hook'],
      antonyms: ['drift'],
    })
  })

  it('falls back safely when optional fields are missing or invalid', () => {
    expect(
      mapFieldsToFlashcard(
        {
          word: 'běžet',
          translation: 'бежать',
          level: 'Z9',
          popularity: 999,
          part_of_speech: 'глагол',
          style: 'разговорный',
          examples_html: '<ul><li>Ráno <b>běžím</b>.</li><li>Pes <b>běží</b>.</li></ul>',
          gender: 'женский',
          verb_class: '-it/-et/-ět',
          verb_irregular: 'běžím, běžíš',
          note: 'Нужно различать с utíkat.',
        },
        'czech'
      )
    ).toEqual({
      expression: 'běžet',
      translation: 'бежать',
      examples: ['Ráno <b>běžím</b>.', 'Pes <b>běží</b>.'],
      level: 'B1',
      partOfSpeech: 'глагол',
      gender: 'женский',
      frequency: 10,
      style: 'разговорный',
      note: 'Спряжение: -it/-et/-ět • Исключения: běžím, běžíš • Нужно различать с utíkat.',
      imageUrl: undefined,
      synonyms: undefined,
      antonyms: undefined,
    })
  })
})
