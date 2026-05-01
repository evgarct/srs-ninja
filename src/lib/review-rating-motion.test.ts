import { describe, expect, it } from 'vitest'

import { getReviewRatingMotion } from './review-rating-motion'

describe('getReviewRatingMotion', () => {
  it('sends Again and Hard to the left, with Again more aggressive than Hard', () => {
    const again = getReviewRatingMotion(1)
    const hard = getReviewRatingMotion(2)

    expect(again.exit.x).toBeLessThan(0)
    expect(hard.exit.x).toBeLessThan(0)
    expect(Math.abs(again.exit.x)).toBeGreaterThan(Math.abs(hard.exit.x))
  })

  it('sends Good and Easy to the right, with Easy more aggressive than Good', () => {
    const good = getReviewRatingMotion(3)
    const easy = getReviewRatingMotion(4)

    expect(good.exit.x).toBeGreaterThan(0)
    expect(easy.exit.x).toBeGreaterThan(0)
    expect(easy.exit.x).toBeGreaterThan(good.exit.x)
  })

  it('keeps all ratings burst-enabled with matching emoji payloads', () => {
    expect(getReviewRatingMotion(1).shouldBurst).toBe(true)
    expect(getReviewRatingMotion(2).burstEmojis).toContain('😬')
    expect(getReviewRatingMotion(3).burstEmojis).toContain('✨')
    expect(getReviewRatingMotion(4).burstEmojis).toContain('🚀')
  })
})
