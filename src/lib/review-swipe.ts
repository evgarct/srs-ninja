import type { Rating } from '@/lib/types'

export const REVIEW_SWIPE_COMMIT_THRESHOLD = 96
export const REVIEW_SWIPE_MAX_OFFSET = 160
/** A touch starts tracking a swipe only after this much movement, and only if it is mostly horizontal. */
export const REVIEW_SWIPE_LOCK_DISTANCE = 10

export function clampReviewSwipeOffset(offsetX: number) {
  return Math.max(-REVIEW_SWIPE_MAX_OFFSET, Math.min(REVIEW_SWIPE_MAX_OFFSET, offsetX))
}

export function getReviewSwipeRating(offsetX: number): Rating | null {
  if (offsetX <= -REVIEW_SWIPE_COMMIT_THRESHOLD) return 1
  if (offsetX >= REVIEW_SWIPE_COMMIT_THRESHOLD) return 4
  return null
}

export function getReviewSwipeAnchorX(offsetX: number) {
  if (offsetX < 0) return 0.16
  if (offsetX > 0) return 0.84
  return 0.5
}
