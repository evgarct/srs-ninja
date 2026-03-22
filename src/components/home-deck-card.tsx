import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCheck, FolderOpen, Play } from 'lucide-react'

import { ExtraStudyBox } from '@/components/extra-study-box'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
  completedToday = false,
}: HomeDeckCardProps) {
  const secondaryActionClassName = cn(
    buttonVariants({ variant: 'outline', size: 'lg' }),
    'min-h-12 justify-center gap-2 rounded-xl px-4 py-3 text-center text-sm font-medium'
  )

  const primaryActionClassName = cn(
    buttonVariants({ size: 'lg' }),
    'min-h-12 justify-between rounded-xl px-4 py-3 text-left text-sm font-medium'
  )

  const statusChips = [
    completedToday
      ? {
          key: 'done',
          label: 'Done today',
          variant: 'secondary' as const,
          icon: <CheckCheck className="size-3.5" />,
          className: 'bg-emerald-500/10 text-emerald-700',
          detail: 'You already finished the main review session for this deck today.',
        }
      : null,
    !completedToday && due > 0
      ? {
          key: 'to-study',
          label: `${due} to study`,
          variant: 'outline' as const,
          icon: null,
          className: '',
          detail: `${due} ${due === 1 ? 'card is' : 'cards are'} queued for the next study session on this deck.`,
        }
      : null,
    !completedToday && due === 0
      ? {
          key: 'start',
          label: 'Ready to start',
          variant: 'secondary' as const,
          icon: <Play className="size-3.5 fill-current" />,
          className: 'bg-sky-500/10 text-sky-700',
          detail: 'You have not studied this deck today yet. Start with new cards from this deck.',
        }
      : null,
    drafts > 0
      ? {
          key: 'drafts',
          label: `${drafts} ${drafts === 1 ? 'draft' : 'drafts'}`,
          variant: 'outline' as const,
          icon: null,
          className: '',
          detail: `${drafts} ${drafts === 1 ? 'note is' : 'notes are'} waiting for review in this deck.`,
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string
    label: string
    variant: 'secondary' | 'outline'
    icon: React.ReactNode
    className: string
    detail: string
  }>

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="min-w-0 text-xl break-words">
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

          {statusChips.length > 0 ? (
            <div className="flex max-w-[11rem] flex-wrap justify-end gap-2">
              {statusChips.map((chip) => (
                <Tooltip key={chip.key}>
                  <TooltipTrigger
                    render={
                      <Badge variant={chip.variant} className={cn('gap-1', chip.className)} />
                    }
                  >
                    {chip.icon}
                    {chip.label}
                  </TooltipTrigger>
                  <TooltipContent>{chip.detail}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 pt-0">
        {!completedToday && due > 0 ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href={`/decks/${deck.id}/review`} className={cn(primaryActionClassName, 'flex-1')}>
              <span>{completedToday ? 'Continue review' : 'Continue learning'}</span>
              <ArrowRight className="size-4 text-primary-foreground/80" />
            </Link>
            <Link href={`/deck/${deck.id}`} className={secondaryActionClassName}>
              <FolderOpen className="size-4" />
              Open deck
            </Link>
          </div>
        ) : (
          <ExtraStudyBox deckId={deck.id} mode={completedToday ? 'menu' : 'direct'} />
        )}
      </CardContent>
    </Card>
  )
}
