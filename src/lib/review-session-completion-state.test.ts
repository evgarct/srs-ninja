import { describe, expect, it } from 'vitest'

import { buildCompletionUrl } from '@/lib/review-session-completion-state'

describe('buildCompletionUrl', () => {
  it('adds completed flag while preserving existing params', () => {
    expect(buildCompletionUrl('/review/deck-1', 'mode=due&limit=20', true))
      .toBe('/review/deck-1?mode=due&limit=20&completed=1')
  })

  it('removes completed flag while preserving other params', () => {
    expect(buildCompletionUrl('/review/deck-1', 'mode=extra&completed=1&limit=10', false))
      .toBe('/review/deck-1?mode=extra&limit=10')
  })

  it('returns pathname when there are no params left', () => {
    expect(buildCompletionUrl('/review/deck-1', 'completed=1', false))
      .toBe('/review/deck-1')
  })
})
