import { describe, expect, it } from 'vitest'

import { shouldSuggestExtraStudy } from './extra-study'

describe('shouldSuggestExtraStudy', () => {
  it('does not actively suggest extra study once the user already studied today', () => {
    expect(shouldSuggestExtraStudy(false)).toBe(true)
    expect(shouldSuggestExtraStudy(true)).toBe(false)
  })
})
