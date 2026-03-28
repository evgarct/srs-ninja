'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { approveDraftNote } from '@/lib/actions/drafts'

export function ApproveDraftButton({
  noteId,
  disabled = false,
  disabledLabel,
  onApproved,
}: {
  noteId: string
  disabled?: boolean
  disabledLabel?: string
  onApproved?: (noteId: string) => void
}) {
  const [isPending, setIsPending] = useState(false)

  async function handleApprove() {
    if (isPending) return

    setIsPending(true)

    try {
      await approveDraftNote(noteId)
      toast.success('Draft approved')
      onApproved?.(noteId)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve draft')
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
      disabled={isPending || disabled}
    >
      <Check className="size-4" />
      {isPending ? 'Approving...' : disabled && disabledLabel ? disabledLabel : 'Approve'}
    </Button>
  )
}
