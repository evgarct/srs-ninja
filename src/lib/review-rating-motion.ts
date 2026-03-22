import type { Rating } from '@/lib/types'

export type ReviewRatingMotion = {
  enter: {
    x: number
    y: number
    scale: number
    opacity: number
  }
  exit: {
    x: number
    y: number
    rotate: number
    scale: number
    opacity: number
  }
  shouldBurst: boolean
  burstEmojis: string[]
}

const REVIEW_RATING_MOTIONS: Record<Rating, ReviewRatingMotion> = {
  1: {
    enter: { x: 44, y: 0, scale: 0.975, opacity: 0 },
    exit: { x: -520, y: 0, rotate: -18, scale: 0.94, opacity: 0 },
    shouldBurst: true,
    burstEmojis: ['↺', '😵', '💥'],
  },
  2: {
    enter: { x: 28, y: 0, scale: 0.98, opacity: 0 },
    exit: { x: -360, y: 0, rotate: -12, scale: 0.952, opacity: 0 },
    shouldBurst: true,
    burstEmojis: ['✖️', '😬', '⏳'],
  },
  3: {
    enter: { x: -28, y: 0, scale: 0.98, opacity: 0 },
    exit: { x: 360, y: 0, rotate: 12, scale: 0.952, opacity: 0 },
    shouldBurst: true,
    burstEmojis: ['✨', '👍', '⚡'],
  },
  4: {
    enter: { x: -44, y: 0, scale: 0.975, opacity: 0 },
    exit: { x: 520, y: 0, rotate: 18, scale: 0.94, opacity: 0 },
    shouldBurst: true,
    burstEmojis: ['💚', '🌟', '🚀'],
  },
}

export function getReviewRatingMotion(rating: Rating): ReviewRatingMotion {
  return REVIEW_RATING_MOTIONS[rating]
}
