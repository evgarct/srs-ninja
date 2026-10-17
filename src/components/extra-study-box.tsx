'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown, FolderOpen } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { buttonVariants } from '@/lib/button-variants'
import { buildReviewSessionHref } from '@/lib/review-session-route'
import { cn } from '@/lib/utils'

export function ExtraStudyBox({
  deckId,
}: {
  deckId: string
}) {
  const t = useTranslations('home')
  const router = useRouter()
  const primaryActionClassName = cn(
    buttonVariants({ size: 'lg' }),
    'min-h-12 justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium shadow-[0_18px_40px_-28px_rgba(244,255,120,0.95)]'
  )
  const secondaryActionClassName = cn(
    buttonVariants({ variant: 'outline', size: 'lg' }),
    'min-h-12 justify-center gap-2 rounded-2xl border-foreground/10 bg-foreground/[0.03] px-4 py-3 text-center text-sm font-medium text-foreground hover:bg-foreground/[0.07]'
  )

  const startExtra = (limit: number) => {
    router.push(buildReviewSessionHref(deckId, { mode: 'extra', limit }))
  }

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button className={cn(primaryActionClassName, 'flex-1')}>
                <span className="flex-1 text-left">{t('continueLearning')}</span>
                <ChevronDown className="size-4 opacity-70" />
              </Button>
            }
          />
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t('extraStudy')}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => startExtra(10)}>
                {t('addCards', { count: 10 })}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => startExtra(20)}>
                {t('addCards', { count: 20 })}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Link href={`/deck/${deckId}`} className={secondaryActionClassName}>
          <FolderOpen className="size-4" />
          {t('open')}
        </Link>
      </div>
    </div>
  )
}
