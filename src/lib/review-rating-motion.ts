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
  /** Radial glow color used for the card-level rating pulse. */
  glowColor: string
}

const REVIEW_RATING_MOTIONS: Record<Rating, ReviewRatingMotion> = {
  1: {
    enter: { x: 0, y: 12, scale: 0.985, opacity: 0 },
    exit: { x: -520, y: 0, rotate: -18, scale: 0.94, opacity: 0 },
    shouldBurst: true,
    burstEmojis: ['↺', '😵', '💥'],
    glowColor: 'rgba(251, 113, 133, 0.55)',
  },
  2: {
    enter: { x: 0, y: 12, scale: 0.985, opacity: 0 },
    exit: { x: -360, y: 0, rotate: -12, scale: 0.952, opacity: 0 },
    shouldBurst: true,
    burstEmojis: ['✖️', '😬', '⏳'],
    glowColor: 'rgba(251, 146, 60, 0.5)',
  },
  3: {
    enter: { x: 0, y: 12, scale: 0.985, opacity: 0 },
    exit: { x: 360, y: 0, rotate: 12, scale: 0.952, opacity: 0 },
    shouldBurst: true,
    burstEmojis: ['✨', '👍', '⚡'],
    glowColor: 'rgba(56, 189, 248, 0.5)',
  },
  4: {
    enter: { x: 0, y: 12, scale: 0.985, opacity: 0 },
    exit: { x: 520, y: 0, rotate: 18, scale: 0.94, opacity: 0 },
    shouldBurst: true,
    burstEmojis: ['💚', '🌟', '🚀'],
    glowColor: 'rgba(52, 211, 153, 0.55)',
  },
}

export function getReviewRatingMotion(rating: Rating): ReviewRatingMotion {
  return REVIEW_RATING_MOTIONS[rating]
}
