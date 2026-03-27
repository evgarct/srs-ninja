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
          expression: 'konev',
          translation: 'лейка',
          level: 'Z9',
          popularity: 999,
          part_of_speech: 'noun',
          gender: 'ženský',
          note: 'ч. мн.: konve',
        },
        'czech'
      )
    ).toEqual({
      expression: 'konev',
      translation: 'лейка',
      examples: [],
      level: 'B1',
      partOfSpeech: 'noun',
      gender: 'ženský',
      frequency: 10,
      style: '',
      note: 'ч. мн.: konve',
      imageUrl: undefined,
      synonyms: undefined,
      antonyms: undefined,
    })
  })
})
