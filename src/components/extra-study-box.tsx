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
import { cn } from '@/lib/utils'

export function ExtraStudyBox({
  deckId,
  mode = 'menu',
}: {
  deckId: string
  mode?: 'menu' | 'direct'
}) {
  const router = useRouter()
  const primaryActionClassName = cn(
    buttonVariants({ size: 'lg' }),
    'min-h-12 justify-between rounded-xl px-4 py-3 text-left text-sm font-medium'
  )
  const secondaryActionClassName = cn(
    buttonVariants({ variant: 'outline', size: 'lg' }),
    'min-h-12 justify-center gap-2 rounded-xl px-4 py-3 text-center text-sm font-medium'
  )

  const startExtra = (limit: number) => {
    router.push(`/review/${deckId}?mode=extra&limit=${limit}`)
  }

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row">
        {mode === 'menu' ? (
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
        ) : (
          <Link
            href={`/review/${deckId}?mode=extra&limit=10`}
            className={cn(primaryActionClassName, 'flex-1')}
          >
            <span>Continue learning</span>
          </Link>
        )}
        <Link href={`/deck/${deckId}`} className={secondaryActionClassName}>
          <FolderOpen className="size-4" />
          Open deck
        </Link>
      </div>
    </div>
  )
}
