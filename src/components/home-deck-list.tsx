'use client'

import { motion, useReducedMotion } from 'motion/react'

import { HomeDeckCard } from '@/components/home-deck-card'

export interface HomeDeckListItem {
  deck: {
    id: string
    name: string
    language: string
    translation_language: string
  }
  due: number
  drafts: number
  completedToday?: boolean
}

interface HomeDeckListProps {
  deckStats: HomeDeckListItem[]
}

export function HomeDeckList({ deckStats }: HomeDeckListProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section
      data-testid="home-deck-scroll-region"
      className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain"
    >
      <div className="grid auto-rows-max gap-3 pb-1 md:grid-cols-2">
        {deckStats.map(({ deck, due, drafts, completedToday }, index) => (
          <motion.div
            key={deck.id}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut', delay: Math.min(index, 6) * 0.045 }}
          >
            <HomeDeckCard
              deck={deck}
              due={due}
              drafts={drafts}
              completedToday={completedToday}
            />
          </motion.div>
        ))}
      </div>
    </section>
  )
}
