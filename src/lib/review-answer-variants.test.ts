import { describe, expect, it } from 'vitest'
import { buildReviewCardSides, normalizeForCompare } from '@/lib/review-answer-variants'

const czechFields = {
  word: 'mluvit',
  translation: 'говорить; разговаривать',
  part_of_speech: 'sloveso',
  synonyms: ['říkat', 'povídat'],
}

describe('normalizeForCompare', () => {
  it('drops diacritics, case and extra whitespace', () => {
    expect(normalizeForCompare('  Říkat   ŽÁDNÝ ')).toBe('rikat zadny')
  })
})

describe('buildReviewCardSides', () => {
  it('asks the Russian side and accepts the word plus synonyms for production', () => {
    const sides = buildReviewCardSides(czechFields, 'czech', 'production')

    expect(sides.question).toBe('говорить; разговаривать')
    expect(sides.answer).toBe('mluvit')
    expect(sides.acceptedAnswers).toEqual(['mluvit', 'říkat', 'povídat'])
    expect(sides.acceptedAnswersNormalized).toEqual(['mluvit', 'rikat', 'povidat'])
    expect(sides.hints.partOfSpeech).toBe('sloveso')
  })

  it('splits translation variants and ignores synonyms for recognition', () => {
    const sides = buildReviewCardSides(czechFields, 'czech', 'recognition')

    expect(sides.question).toBe('mluvit')
    expect(sides.acceptedAnswers).toEqual(['говорить', 'разговаривать'])
  })

  it('splits slash-separated aspect pairs and dedupes ignoring diacritics', () => {
    const sides = buildReviewCardSides(
      { word: 'dělat / udělat', translation: 'делать', synonyms: ['Udelat'] },
      'czech',
      'production'
    )

    expect(sides.acceptedAnswers).toEqual(['dělat', 'udělat'])
  })

  it('omits hints that are not set', () => {
    const sides = buildReviewCardSides({ word: 'cesta', translation: 'путь' }, 'czech', 'production')

    expect(sides.hints.gender).toBeUndefined()
  })
})
