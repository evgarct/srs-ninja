import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, FolderOpen } from 'lucide-react'

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
  drafts: number
  completedToday?: boolean
}

export function HomeDeckCard({
  deck,
  due,
  drafts,
}: HomeDeckCardProps) {
  const accentClassName =
    deck.language === 'english'
      ? 'from-sky-400/22 via-violet-400/10 to-transparent'
      : 'from-rose-400/18 via-orange-300/8 to-transparent'

  const secondaryActionClassName = cn(
    buttonVariants({ variant: 'outline', size: 'lg' }),
    'min-h-11 justify-center gap-2 rounded-2xl border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-center text-sm font-medium text-white hover:bg-white/[0.08]'
  )

  const primaryActionClassName = cn(
    buttonVariants({ size: 'lg' }),
    'min-h-11 justify-between rounded-2xl px-3.5 py-2.5 text-left text-sm font-medium shadow-[0_18px_40px_-28px_rgba(244,255,120,0.95)]'
  )

  return (
    <Card className="app-panel flex h-full overflow-hidden border-white/10 bg-white/[0.055] py-0">
      <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br opacity-100', accentClassName)} />
      <div className="pointer-events-none absolute -right-8 top-0 h-28 w-28 rounded-full bg-primary/18 blur-3xl" />

      <CardHeader className="relative gap-3 border-b border-white/8 pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <span className="text-xs font-medium uppercase tracking-[0.22em] text-white/42">
              {deck.language}
            </span>
            <CardTitle className="min-w-0 text-[1.75rem] font-semibold tracking-[-0.04em] text-white break-words">
              <span className="inline-flex items-center gap-2">
                {DECK_FLAG[deck.language] ? (
                  <Image
                    src={DECK_FLAG[deck.language].src}
                    alt={DECK_FLAG[deck.language].alt}
                    width={20}
                    height={16}
                    className="h-4 w-5 rounded-[2px] object-cover shadow-sm"
                  />
                ) : null}
                <span>{deck.name}</span>
              </span>
            </CardTitle>

            {drafts > 0 ? (
              <Badge
                variant="outline"
                className="rounded-full border-white/12 bg-white/[0.05] px-3 py-1 text-white"
              >
                {drafts} drafts
              </Badge>
            ) : null}
          </div>

          <div className="shrink-0 rounded-[22px] border border-white/10 bg-black/25 px-4 py-2.5 text-right backdrop-blur-md">
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-white/42">due</p>
            <p className="mt-1 text-3xl font-semibold tracking-[-0.06em] text-white">{due}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative flex flex-1 flex-col py-3">
        {due > 0 ? (
          <div className="mt-auto flex flex-col gap-2 sm:flex-row">
            <Link href={`/decks/${deck.id}/review`} className={cn(primaryActionClassName, 'flex-1')}>
              <span>Начать review</span>
              <ArrowRight className="size-4 text-primary-foreground/80" />
            </Link>
            <Link href={`/deck/${deck.id}`} className={secondaryActionClassName}>
              <FolderOpen className="size-4" />
              Открыть
            </Link>
          </div>
        ) : (
          <div className="mt-auto">
            <ExtraStudyBox deckId={deck.id} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
