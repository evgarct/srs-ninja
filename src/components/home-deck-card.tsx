import Link from 'next/link'
import { CheckCheck } from 'lucide-react'

import { ExtraStudyBox } from '@/components/extra-study-box'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/lib/button-variants'
import { cn } from '@/lib/utils'

const DECK_FLAG: Record<string, { src: string; alt: string }> = {
  czech: { src: '/flags/cz.svg', alt: 'Czech flag' },
  english: { src: '/flags/gb.svg', alt: 'United Kingdom flag' },
}

export interface HomeDeckCardProps {
  deck: {
    id: string
    name: string
    language: string
  }
  due: number
  total: number
  drafts: number
  completedToday?: boolean
}

export function HomeDeckCard({
  deck,
  due,
  total,
  drafts,
  completedToday = false,
}: HomeDeckCardProps) {
  const secondaryActionClassName = cn(
    buttonVariants({ variant: 'outline' }),
    'min-w-28 justify-center text-center'
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-xl break-words">
              <span className="inline-flex items-center gap-2">
                {DECK_FLAG[deck.language] ? (
                  <img
                    src={DECK_FLAG[deck.language].src}
                    alt={DECK_FLAG[deck.language].alt}
                    className="h-4 w-5 rounded-[2px] object-cover shadow-sm"
                  />
                ) : null}
                <span>{deck.name}</span>
              </span>
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{total} cards total</p>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {completedToday && (
              <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-700">
                <CheckCheck className="size-3.5" />
                Done today
              </Badge>
            )}
            {drafts > 0 && <Badge variant="outline">{drafts} draft</Badge>}
            {due > 0 && <Badge variant="destructive">{due} due</Badge>}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {due > 0 ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href={`/decks/${deck.id}/review`}
              className={cn(buttonVariants(), 'flex-1 justify-start text-left')}
            >
              {completedToday ? `Continue review (${due})` : `Study (${due})`}
            </Link>
            <Link href={`/deck/${deck.id}`} className={secondaryActionClassName}>
              Open deck
            </Link>
          </div>
        ) : (
          <ExtraStudyBox deckId={deck.id} hasStudiedToday={completedToday} />
        )}
      </CardContent>
    </Card>
  )
}
