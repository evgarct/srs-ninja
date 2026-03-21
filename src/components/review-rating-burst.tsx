'use client'

import { motion } from 'motion/react'

import type { Rating } from '@/lib/types'
import { getReviewRatingMotion } from '@/lib/review-rating-motion'

export function ReviewRatingBurst({
  rating,
  reducedMotion = false,
  anchorX = 0.5,
  className,
}: {
  rating: Rating
  reducedMotion?: boolean
  anchorX?: number
  className?: string
}) {
  const motionPreset = getReviewRatingMotion(rating)

  if (reducedMotion || !motionPreset.shouldBurst) return null

  const horizontalDirection = Math.sign(motionPreset.exit.x) || 1

  return (
    <div className={`pointer-events-none absolute inset-0 z-20 overflow-visible ${className ?? ''}`}>
      {motionPreset.burstEmojis.map((emoji, index) => {
        const spreadX = horizontalDirection * (28 + index * 18)
        const liftY = -62 - index * 18 + motionPreset.exit.y * 0.18

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
              duration: 0.8,
              ease: 'easeOut',
              delay: index * 0.04,
            }}
            className="absolute top-[78%] text-[1.65rem] drop-shadow-[0_8px_14px_rgba(255,255,255,0.45)] sm:text-[1.9rem]"
            style={{ left: `${anchorX * 100}%` }}
          >
            {emoji}
          </motion.span>
        )
      })}
    </div>
  )
}
