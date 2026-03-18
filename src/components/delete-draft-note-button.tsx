'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { deleteDraftNote } from '@/lib/actions/drafts'

export function DeleteDraftNoteButton({
  noteId,
  onDeleted,
  iconOnly = false,
}: {
  noteId: string
  onDeleted?: (noteId: string) => void
  iconOnly?: boolean
}) {
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (isPending) return
    if (!confirm('Delete this draft note?')) return

    setIsPending(true)

    try {
      await deleteDraftNote(noteId)
      toast.success('Draft note deleted')
      onDeleted?.(noteId)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete draft note')
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
      title="Delete draft"
    >
      <Trash2 className="size-4" />
      {iconOnly ? null : isPending ? 'Deleting...' : 'Delete draft'}
    </Button>
  )
}
