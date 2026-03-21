'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useMemo } from 'react'

import type { Rating } from '@/lib/types'
import { getReviewRatingMotion } from '@/lib/review-rating-motion'

type ReviewStackCard = {
  id: string
  content: React.ReactNode
}

export function ReactBitsReviewStack({
  cards,
  activeCardKey,
  lastRating,
  maxVisible = 4,
}: {
  cards: ReviewStackCard[]
  activeCardKey: string
  lastRating: Rating | null
  maxVisible?: number
}) {
  const shouldReduceMotion = useReducedMotion()
  const visibleCards = useMemo(() => cards.slice(0, maxVisible), [cards, maxVisible])
  const topCard = visibleCards[0]
  const backCards = visibleCards.slice(1)
  const ratingMotion = lastRating ? getReviewRatingMotion(lastRating) : null

  if (!topCard) return null

  return (
    <div className="relative w-full" style={{ perspective: 900 }}>
      <div aria-hidden className="invisible pointer-events-none">
        {topCard.content}
      </div>

      {backCards.map((card, index) => {
        const depth = index + 1
        const xOffset = depth * 8
        const yOffset = depth * 10
        const rotate = depth === 1 ? 2.5 : depth === 2 ? 4 : 5.5
        const opacity = depth === 1 ? 0.52 : depth === 2 ? 0.32 : 0.18

        return (
          <motion.div
            key={card.id}
            className="pointer-events-none absolute inset-0"
            animate={{
              rotateZ: rotate,
              scale: 1 - depth * 0.02,
              y: yOffset,
              x: xOffset,
              transformOrigin: '88% 88%',
              opacity,
            }}
            initial={false}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <div className="h-full w-full rounded-2xl border border-foreground/10 bg-card shadow-sm ring-1 ring-foreground/5" />
          </motion.div>
        )
      })}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeCardKey}
          className="absolute inset-0 z-10"
          initial={
            shouldReduceMotion
              ? { opacity: 0, y: 8, scale: 0.995 }
              : ratingMotion?.enter ?? { opacity: 0, x: 36, scale: 0.985, rotate: 2 }
          }
          animate={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
          exit={
            shouldReduceMotion
              ? { opacity: 0, y: -8, scale: 0.99 }
              : ratingMotion?.exit ?? { opacity: 0, x: -260, scale: 0.96, rotate: -12 }
          }
          transition={{ type: 'spring', stiffness: 220, damping: 22, mass: 0.85 }}
          style={{ transformOrigin: 'center 78%' }}
        >
          {topCard.content}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
