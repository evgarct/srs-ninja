'use client'

import { useState } from 'react'
import { CheckCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { approveDraftBatch } from '@/lib/actions/drafts'
import type { ApproveDraftBatchResult } from '@/lib/draft-import-service'

export function ApproveDraftBatchButton({
  batchId,
  pendingCount,
  disabled = false,
  onApproved,
}: {
  batchId: string
  pendingCount: number
  disabled?: boolean
  onApproved?: (result: ApproveDraftBatchResult) => void
}) {
  const [isPending, setIsPending] = useState(false)

  async function handleApprove() {
    if (isPending) return
    if (
      !confirm(
        `Approve all ${pendingCount} remaining draft note${pendingCount === 1 ? '' : 's'} in this batch?`
      )
    ) {
      return
    }

    setIsPending(true)

    try {
      const result = await approveDraftBatch(batchId)

      if (result.approvedNoteIds.length === 0) {
        toast.info('No draft notes could be approved. Resolve conflicts first.')
      } else if (result.skippedNoteIds.length > 0) {
        toast.success(
          `Approved ${result.approvedNoteIds.length} draft notes · ${result.skippedNoteIds.length} skipped (resolve conflicts first)`
        )
      } else {
        toast.success(`Approved ${result.approvedNoteIds.length} draft notes`)
      }

      onApproved?.(result)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve draft batch')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Button
      size="sm"
      onClick={() => {
        void handleApprove()
      }}
      disabled={isPending || disabled || pendingCount === 0}
    >
      <CheckCheck className="size-4" />
      {isPending ? 'Approving...' : 'Approve batch'}
    </Button>
  )
}
