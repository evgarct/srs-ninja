'use client'

import {
  getFsrsStateLabel,
  getFsrsStateTone,
  type FsrsState,
} from '@/lib/deck-notes'
import { cn } from '@/lib/utils'

interface DeckStatusBadgeProps {
  state: FsrsState
  memoryScore?: number | null
  className?: string
}

export function DeckStatusBadge({
  state,
  memoryScore,
  className,
}: DeckStatusBadgeProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span
        className={cn(
          'inline-flex h-7 items-center rounded-full border px-3 text-xs font-semibold',
          getFsrsStateTone(state)
        )}
      >
        {getFsrsStateLabel(state)}
      </span>
      {memoryScore !== null && memoryScore !== undefined && (
        <span className="text-xs font-medium text-muted-foreground">
          {memoryScore}%
        </span>
      )}
    </div>
  )
}
