'use client'

import Link from 'next/link'
import { DeleteDraftBatchButton } from '@/components/delete-draft-batch-button'
import { DraftStatusBadge } from '@/components/draft-status-badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/lib/button-variants'
import { cn } from '@/lib/utils'

type ImportBatchCardStatus = 'draft' | 'partially_approved' | 'approved' | 'archived'

export interface ImportReviewBatchCardProps {
  id: string
  deckId: string
  deckName: string
  topic?: string | null
  createdAt: string
  updatedAt: string
  source: string
  modelName?: string | null
  draftCount: number
  status: ImportBatchCardStatus
  showDelete?: boolean
}

export function ImportReviewBatchCard({
  id,
  deckId,
  deckName,
  topic,
  createdAt,
  updatedAt,
  source,
  modelName,
  draftCount,
  status,
  showDelete = false,
}: ImportReviewBatchCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm font-semibold sm:text-base">{deckName}</CardTitle>
          <DraftStatusBadge status={status} />
        </div>
        <CardDescription className="line-clamp-2 text-xs leading-5 sm:text-sm">
          {topic?.trim() || `Batch created on ${createdAt.slice(0, 10)}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="grid gap-x-3 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
          <p className="font-medium text-foreground">
            {draftCount} {draftCount === 1 ? 'draft note' : 'draft notes'}
          </p>
          {modelName ? (
            <p className="truncate" title={modelName}>
              Model: {modelName}
            </p>
          ) : (
            <p>Source: {source}</p>
          )}
          {modelName && <p>Source: {source}</p>}
          <p>Updated {updatedAt.slice(0, 10)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/deck/${deckId}/drafts?batchId=${id}`}
            className={buttonVariants({ size: 'sm' })}
          >
            Open Batch Review
          </Link>
          <Link
            href={`/deck/${deckId}/drafts`}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            Open Deck Drafts
          </Link>
          {showDelete ? (
            <div className={cn('ml-auto')}>
              <DeleteDraftBatchButton batchId={id} iconOnly />
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
