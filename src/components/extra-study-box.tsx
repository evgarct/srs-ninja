'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { buttonVariants } from '@/lib/button-variants'
import { cn } from '@/lib/utils'

export function ExtraStudyBox({
  deckId,
  hasStudiedToday = false,
}: {
  deckId: string
  hasStudiedToday?: boolean
}) {
  const router = useRouter()
  const secondaryActionClassName = cn(
    buttonVariants({ variant: 'outline' }),
    'min-w-28 justify-center text-center'
  )

  const startExtra = (limit: number) => {
    router.push(`/review/${deckId}?mode=extra&limit=${limit}`)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button className="flex-1 justify-between text-left">
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
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => startExtra(30)}>
              +30 cards
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Link href={`/deck/${deckId}`} className={secondaryActionClassName}>
          Open deck
        </Link>
      </div>

      {!hasStudiedToday && (
        <p className="text-sm text-muted-foreground">
          No cards due. You can still study a few new ones.
        </p>
      )}
    </div>
  )
}
