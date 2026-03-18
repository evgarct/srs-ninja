'use client'

import { useTransition } from 'react'
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
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      size="sm"
      onClick={() =>
        startTransition(async () => {
          try {
            await approveDraftNote(noteId)
            toast.success('Draft approved')
            onApproved?.(noteId)
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to approve draft')
          }
        })
      }
      disabled={isPending}
    >
      <Check className="size-4" />
      {isPending ? 'Approving...' : 'Approve'}
    </Button>
  )
}
