import { describe, expect, it } from 'vitest'

import { applyReviewQueueOutcome, getReviewRequeueWindow } from './review-loop'

describe('getReviewRequeueWindow', () => {
  it('requeues Again sooner than Hard and releases Good/Easy', () => {
    expect(getReviewRequeueWindow(10, 1)).toEqual({ min: 2, max: 4 })
    expect(getReviewRequeueWindow(10, 2)).toEqual({ min: 5, max: 8 })
    expect(getReviewRequeueWindow(10, 3)).toBeNull()
    expect(getReviewRequeueWindow(10, 4)).toBeNull()
  })

  it('collapses gracefully for short queues', () => {
    expect(getReviewRequeueWindow(1, 1)).toEqual({ min: 1, max: 1 })
    expect(getReviewRequeueWindow(2, 2)).toEqual({ min: 2, max: 2 })
  })
})

describe('applyReviewQueueOutcome', () => {
  it('moves Again cards into an earlier delayed window', () => {
    expect(applyReviewQueueOutcome(['a', 'b', 'c', 'd', 'e', 'f'], 1, { random: () => 0 })).toEqual([
      'b',
      'a',
      'c',
      'd',
      'e',
      'f',
    ])
  })

  it('moves Hard cards later than Again', () => {
    expect(applyReviewQueueOutcome(['a', 'b', 'c', 'd', 'e', 'f'], 2, { random: () => 0 })).toEqual([
      'b',
      'c',
      'd',
      'a',
      'e',
      'f',
    ])
  })

  it('can place difficult cards later within their bounded requeue window', () => {
    expect(applyReviewQueueOutcome(['a', 'b', 'c', 'd', 'e', 'f'], 1, { random: () => 0.99 })).toEqual([
      'b',
      'c',
      'a',
      'd',
      'e',
      'f',
    ])
  })

  it('removes Good and Easy cards from the active queue', () => {
    expect(applyReviewQueueOutcome(['a', 'b', 'c'], 3)).toEqual(['b', 'c'])
    expect(applyReviewQueueOutcome(['a', 'b', 'c'], 4)).toEqual(['b', 'c'])
  })
})
