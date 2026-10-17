import Image from 'next/image'
import { ArrowRight, FolderOpen } from 'lucide-react'

import { ExtraStudyBox } from '@/components/extra-study-box'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/lib/button-variants'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { buildReviewSessionHref } from '@/lib/review-session-route'
import { PendingLink } from '@/components/pending-link'

const DECK_FLAG: Record<string, { src: string; alt: string }> = {
  czech: { src: '/flags/cz.svg', alt: 'Czech flag' },
  english: { src: '/flags/gb.svg', alt: 'United Kingdom flag' },
  turkish: { src: '/flags/tr.svg', alt: 'Turkish flag' },
}

export interface HomeDeckCardProps {
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

export function HomeDeckCard({
  deck,
  due,
  drafts,
}: HomeDeckCardProps) {
  const t = useTranslations('home')
  const navT = useTranslations('nav')
  const accentClassName =
    deck.language === 'english'
      ? 'from-sky-400/22 via-violet-400/10 to-transparent'
      : 'from-rose-400/18 via-orange-300/8 to-transparent'

  const secondaryActionClassName = cn(
    buttonVariants({ variant: 'outline', size: 'lg' }),
    'min-h-11 justify-center gap-2 rounded-2xl border-foreground/10 bg-foreground/[0.03] px-3.5 py-2.5 text-center text-sm font-medium text-foreground hover:bg-foreground/[0.07]'
  )

  const primaryActionClassName = cn(
    buttonVariants({ size: 'lg' }),
    'min-h-11 justify-between rounded-2xl px-3.5 py-2.5 text-left text-sm font-medium shadow-[0_18px_40px_-28px_rgba(244,255,120,0.95)]'
  )

  return (
    <Card
      interactive
      className="app-panel relative flex overflow-hidden border-foreground/10 bg-foreground/[0.03] py-0"
    >
      <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br opacity-100', accentClassName)} />
      <div className="pointer-events-none absolute -right-8 top-0 h-28 w-28 rounded-full bg-primary/18 blur-3xl" />

      <CardHeader className="relative gap-3 border-b border-foreground/8 pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <CardTitle className="min-w-0 text-[1.75rem] font-semibold tracking-[-0.04em] text-foreground break-words">
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
                className="rounded-full border-foreground/12 bg-foreground/[0.04] text-foreground px-3 py-1"
              >
                {t('drafts', { count: drafts })}
              </Badge>
            ) : null}
          </div>

          <div className="shrink-0 rounded-[22px] border border-foreground/10 bg-foreground/[0.04] px-4 py-2.5 text-right backdrop-blur-md">
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">{t('due')}</p>
            <p className="mt-1 text-3xl font-semibold tracking-[-0.06em] text-foreground">{due}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative flex flex-1 flex-col py-3">
        {due > 0 ? (
          <div className="mt-auto flex flex-col gap-2 sm:flex-row">
            <PendingLink href={buildReviewSessionHref(deck.id)} pendingLabel={navT('loading')} className={cn(primaryActionClassName, 'flex-1')}>
              <span>{t('startReview')}</span>
              <ArrowRight className="size-4 text-primary-foreground/80" />
            </PendingLink>
            <PendingLink href={`/deck/${deck.id}`} pendingLabel={navT('loading')} className={secondaryActionClassName}>
              <FolderOpen className="size-4" />
              {t('open')}
            </PendingLink>
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
