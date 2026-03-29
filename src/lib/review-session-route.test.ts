import { describe, expect, it } from 'vitest'

import { buildReviewSessionHref, parseReviewSessionSearchParams } from './review-session-route'

describe('parseReviewSessionSearchParams', () => {
  it('parses extra-study params and completion flag', () => {
    expect(
      parseReviewSessionSearchParams({
        mode: 'extra',
        limit: '20',
        completed: '1',
      })
    ).toMatchObject({
      sessionMode: 'extra',
      isCompleted: true,
      limit: 20,
    })
  })

  it('normalizes manual filters and falls back to due defaults', () => {
    expect(
      parseReviewSessionSearchParams({
        mode: 'manual',
        tags: 'verbs, travel ',
        state: 'review,bad-state,new',
        audio: 'missing',
      })
    ).toMatchObject({
      sessionMode: 'manual',
      isCompleted: false,
      manualTags: ['verbs', 'travel'],
      manualStates: ['review', 'new'],
      manualAudioFilter: 'all',
    })

    expect(parseReviewSessionSearchParams({})).toMatchObject({
      sessionMode: 'due',
      limit: 10,
      manualTags: [],
      manualStates: [],
      manualAudioFilter: 'all',
    })
  })
})

describe('buildReviewSessionHref', () => {
  it('builds canonical due, extra, and manual review urls', () => {
    expect(buildReviewSessionHref('deck-1')).toBe('/review/deck-1')
    expect(buildReviewSessionHref('deck-1', { mode: 'extra', limit: 20 })).toBe(
      '/review/deck-1?mode=extra&limit=20'
    )
    expect(
      buildReviewSessionHref('deck-1', {
        mode: 'manual',
        tags: ['verbs', 'travel'],
        states: ['review', 'new'],
        audio: 'with_audio',
        completed: true,
      })
    ).toBe('/review/deck-1?mode=manual&tags=verbs%2Ctravel&state=review%2Cnew&audio=with_audio&completed=1')
  })
})
