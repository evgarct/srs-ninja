import { describe, expect, it } from 'vitest'

import { getNotePrimaryText, normalizeNoteFields } from './note-fields'

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
})
