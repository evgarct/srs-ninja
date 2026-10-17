'use client'

// Adapted from the React Bits "Stack" pattern:
// https://reactbits.dev/components/stack
// Reworked for Echo's review flow: fixed depth-ghost cards behind the active
// card, and the active card's motion is driven by the app's own swipe/rating
// logic instead of the generic drag-to-dismiss interaction.

import { AnimatePresence, motion, useReducedMotion, type TargetAndTransition } from 'motion/react'
import { useMemo, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'

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
  activeCardAnimate,
  activeCardStyle,
  activeCardClassName,
  onActivePointerDown,
  onActivePointerMove,
  onActivePointerUp,
  onActivePointerCancel,
}: {
  cards: ReviewStackCard[]
  activeCardKey: string
  lastRating: Rating | null
  maxVisible?: number
  /** Live override for the active card's animate target (e.g. mid-swipe drag feedback). */
  activeCardAnimate?: TargetAndTransition
  activeCardStyle?: CSSProperties
  activeCardClassName?: string
  onActivePointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void
  onActivePointerMove?: (event: ReactPointerEvent<HTMLDivElement>) => void
  onActivePointerUp?: (event: ReactPointerEvent<HTMLDivElement>) => void
  onActivePointerCancel?: (event: ReactPointerEvent<HTMLDivElement>) => void
}) {
  const shouldReduceMotion = useReducedMotion()
  const visibleCards = useMemo(() => cards.slice(0, maxVisible), [cards, maxVisible])
  const topCard = visibleCards[0]
  const backCards = visibleCards.slice(1)
  const ratingMotion = lastRating ? getReviewRatingMotion(lastRating) : null

  if (!topCard) return null

  return (
    <div className="relative w-full" style={{ perspective: 900 }}>
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
            <div className="h-full w-full rounded-[28px] border border-white/10 bg-[rgba(20,16,33,0.7)] shadow-sm ring-1 ring-white/6" />
          </motion.div>
        )
      })}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeCardKey}
          className={activeCardClassName ?? 'relative z-10 w-full'}
          initial={
            shouldReduceMotion
              ? { opacity: 0, y: 8, scale: 0.995 }
              : ratingMotion?.enter ?? { opacity: 0, x: 36, scale: 0.985, rotate: 2 }
          }
          animate={
            activeCardAnimate ?? { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }
          }
          exit={
            shouldReduceMotion
              ? { opacity: 0, y: -8, scale: 0.99 }
              : ratingMotion?.exit ?? { opacity: 0, x: -260, scale: 0.96, rotate: -12 }
          }
          transition={{ type: 'spring', stiffness: 220, damping: 22, mass: 0.85 }}
          style={{ transformOrigin: 'center 78%', ...activeCardStyle }}
          onPointerDown={onActivePointerDown}
          onPointerMove={onActivePointerMove}
          onPointerUp={onActivePointerUp}
          onPointerCancel={onActivePointerCancel}
        >
          {topCard.content}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
