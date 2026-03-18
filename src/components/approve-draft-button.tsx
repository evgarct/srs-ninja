'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { approveDraftNote } from '@/lib/actions/drafts'

export function ApproveDraftButton({
  noteId,
  onApproved,
}: {
  noteId: string
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
      disabled={isPending}
    >
      <Check className="size-4" />
      {isPending ? 'Approving...' : 'Approve'}
    </Button>
  )
}
