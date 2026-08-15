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
  return (
    <section
      data-testid="home-deck-scroll-region"
      className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain"
    >
      <div className="grid auto-rows-max gap-3 pb-1 md:grid-cols-2">
        {deckStats.map(({ deck, due, drafts, completedToday }) => (
          <HomeDeckCard
            key={deck.id}
            deck={deck}
            due={due}
            drafts={drafts}
            completedToday={completedToday}
          />
        ))}
      </div>
    </section>
  )
}
