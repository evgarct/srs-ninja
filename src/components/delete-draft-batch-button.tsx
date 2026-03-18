'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { deleteDraftBatch } from '@/lib/actions/drafts'

export function DeleteDraftBatchButton({
  batchId,
  onDeleted,
  iconOnly = false,
}: {
  batchId: string
  onDeleted?: (batchId: string) => void
  iconOnly?: boolean
}) {
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (isPending) return
    if (!confirm('Delete this draft batch and all of its remaining draft notes?')) return

    setIsPending(true)

    try {
      await deleteDraftBatch(batchId)
      toast.success('Draft batch deleted')
      onDeleted?.(batchId)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete draft batch')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Button
      variant="outline"
      size={iconOnly ? 'icon' : 'sm'}
      onClick={() => {
        void handleDelete()
      }}
      disabled={isPending}
      className="text-destructive hover:text-destructive"
      title="Delete batch"
    >
      <Trash2 className="size-4" />
      {iconOnly ? null : isPending ? 'Deleting...' : 'Delete batch'}
    </Button>
  )
}
