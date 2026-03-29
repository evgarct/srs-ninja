import { describe, expect, it } from 'vitest'

import {
  clampReviewSwipeOffset,
  getReviewSwipeAnchorX,
  getReviewSwipeRating,
  REVIEW_SWIPE_COMMIT_THRESHOLD,
} from './review-swipe'

describe('clampReviewSwipeOffset', () => {
  it('caps large swipe offsets to the review drag window', () => {
    expect(clampReviewSwipeOffset(-500)).toBe(-160)
    expect(clampReviewSwipeOffset(48)).toBe(48)
    expect(clampReviewSwipeOffset(500)).toBe(160)
  })
})

describe('getReviewSwipeRating', () => {
  it('maps committed horizontal swipes to the matching ratings', () => {
    expect(getReviewSwipeRating(-(REVIEW_SWIPE_COMMIT_THRESHOLD + 1))).toBe(1)
    expect(getReviewSwipeRating(REVIEW_SWIPE_COMMIT_THRESHOLD + 1)).toBe(4)
  })

  it('ignores short swipes', () => {
    expect(getReviewSwipeRating(REVIEW_SWIPE_COMMIT_THRESHOLD - 1)).toBeNull()
    expect(getReviewSwipeRating(-(REVIEW_SWIPE_COMMIT_THRESHOLD - 1))).toBeNull()
  })
})

describe('getReviewSwipeAnchorX', () => {
  it('anchors burst feedback to the swipe direction', () => {
    expect(getReviewSwipeAnchorX(-120)).toBe(0.16)
    expect(getReviewSwipeAnchorX(120)).toBe(0.84)
    expect(getReviewSwipeAnchorX(0)).toBe(0.5)
  })
})
