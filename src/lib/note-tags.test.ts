import { describe, expect, it } from 'vitest'

import { normalizeNoteTags, parseTagsInput } from './note-tags'

describe('normalizeNoteTags', () => {
  it('trims and dedupes tags case-insensitively', () => {
    expect(normalizeNoteTags([' ENGLISH::topic.travel ', 'english::topic.travel', 'B1'])).toEqual([
      'ENGLISH::topic.travel',
      'B1',
    ])
  })
})

describe('parseTagsInput', () => {
  it('parses a comma-separated tag string into normalized tags', () => {
    expect(parseTagsInput('ENGLISH::topic.travel, B1, ENGLISH::topic.travel')).toEqual([
      'ENGLISH::topic.travel',
      'B1',
    ])
  })
})
