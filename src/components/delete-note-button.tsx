'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deleteNote } from '@/lib/actions/notes'
import { Button } from '@/components/ui/button'

export function DeleteNoteButton({
  noteId,
  deckId,
  onDeleted,
  iconOnly = false,
  title,
}: {
  noteId: string
  deckId: string
  onDeleted?: () => void
  iconOnly?: boolean
  title?: string
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('Удалить нот и все его карточки?')) return
    setLoading(true)
    try {
      await deleteNote(noteId, deckId)
      onDeleted?.()
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size={iconOnly ? 'icon' : 'sm'}
      onClick={handleDelete}
      disabled={loading}
      title={title}
      className="text-destructive hover:text-destructive"
    >
      {loading ? '...' : iconOnly ? <Trash2 className="w-4 h-4" /> : 'Удалить'}
    </Button>
  )
}
