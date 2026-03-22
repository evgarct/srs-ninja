'use client'

import { motion } from 'motion/react'

import type { Rating } from '@/lib/types'
import { getReviewRatingMotion } from '@/lib/review-rating-motion'

export function ReviewRatingBurst({
  rating,
  emoji,
  reducedMotion = false,
  anchorX = 0.5,
  className,
}: {
  rating: Rating
  emoji: string
  reducedMotion?: boolean
  anchorX?: number
  className?: string
}) {
  const motionPreset = getReviewRatingMotion(rating)

  if (reducedMotion || !motionPreset.shouldBurst) return null

  const horizontalDirection = Math.sign(motionPreset.exit.x) || 1

  return (
    <div className={`pointer-events-none absolute inset-0 z-20 overflow-visible ${className ?? ''}`}>
      <motion.span
        key={`${rating}-${emoji}`}
        initial={{ x: 0, y: 0, scale: 0.85, opacity: 0 }}
        animate={{
          x: horizontalDirection * 56,
          y: -94 + motionPreset.exit.y * 0.14,
          scale: 1.28,
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 0.92,
          ease: 'easeOut',
        }}
        className="absolute top-[78%] text-[2.15rem] drop-shadow-[0_12px_18px_rgba(255,255,255,0.58)] sm:text-[2.45rem]"
        style={{ left: `${anchorX * 100}%` }}
      >
        {emoji}
      </motion.span>
    </div>
  )
}
