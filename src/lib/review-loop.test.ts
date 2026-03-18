import { describe, expect, it } from 'vitest'

import { applyReviewQueueOutcome, getReviewRequeueOffset } from './review-loop'

describe('getReviewRequeueOffset', () => {
  it('requeues Again sooner than Hard and releases Good/Easy', () => {
    expect(getReviewRequeueOffset(1)).toBe(1)
    expect(getReviewRequeueOffset(2)).toBe(3)
    expect(getReviewRequeueOffset(3)).toBeNull()
    expect(getReviewRequeueOffset(4)).toBeNull()
  })
})

describe('applyReviewQueueOutcome', () => {
  it('moves Again cards back near the front of the remaining queue', () => {
    expect(applyReviewQueueOutcome(['a', 'b', 'c', 'd'], 1)).toEqual([
      'b',
      'a',
      'c',
      'd',
    ])
  })

  it('moves Hard cards later than Again', () => {
    expect(applyReviewQueueOutcome(['a', 'b', 'c', 'd', 'e', 'f'], 2)).toEqual([
      'b',
      'c',
      'd',
      'a',
      'e',
      'f',
    ])
  })

  it('removes Good and Easy cards from the active queue', () => {
    expect(applyReviewQueueOutcome(['a', 'b', 'c'], 3)).toEqual(['b', 'c'])
    expect(applyReviewQueueOutcome(['a', 'b', 'c'], 4)).toEqual(['b', 'c'])
  })
})
