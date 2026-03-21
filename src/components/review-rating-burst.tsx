'use client'

import { motion } from 'motion/react'

import type { Rating } from '@/lib/types'
import { getReviewRatingMotion } from '@/lib/review-rating-motion'

export function ReviewRatingBurst({
  rating,
  reducedMotion = false,
}: {
  rating: Rating
  reducedMotion?: boolean
}) {
  const motionPreset = getReviewRatingMotion(rating)

  if (reducedMotion || !motionPreset.shouldBurst) return null

  const horizontalDirection = Math.sign(motionPreset.exit.x) || 1

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {motionPreset.burstEmojis.map((emoji, index) => {
        const spreadX = horizontalDirection * (34 + index * 18)
        const liftY = -36 - index * 14 + motionPreset.exit.y * 0.18

        return (
          <motion.span
            key={`${rating}-${emoji}-${index}`}
            initial={{ x: 0, y: 0, scale: 0.7, opacity: 0 }}
            animate={{
              x: spreadX,
              y: liftY,
              scale: 1 + index * 0.04,
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 0.72,
              ease: 'easeOut',
              delay: index * 0.035,
            }}
            className="absolute left-1/2 top-[62%] text-xl drop-shadow-sm sm:text-2xl"
          >
            {emoji}
          </motion.span>
        )
      })}
    </div>
  )
}
