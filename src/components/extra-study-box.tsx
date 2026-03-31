'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown, FolderOpen } from 'lucide-react'

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
  const router = useRouter()
  const primaryActionClassName = cn(
    buttonVariants({ size: 'lg' }),
    'min-h-12 justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium shadow-[0_18px_40px_-28px_rgba(244,255,120,0.95)]'
  )
  const secondaryActionClassName = cn(
    buttonVariants({ variant: 'outline', size: 'lg' }),
    'min-h-12 justify-center gap-2 rounded-2xl border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm font-medium text-white hover:bg-white/[0.08]'
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
                <span className="flex-1 text-left">Continue learning</span>
                <ChevronDown className="size-4 opacity-70" />
              </Button>
            }
          />
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Extra study</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => startExtra(10)}>
                +10 cards
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => startExtra(20)}>
                +20 cards
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Link href={`/deck/${deckId}`} className={secondaryActionClassName}>
          <FolderOpen className="size-4" />
          Open deck
        </Link>
      </div>
    </div>
  )
}
