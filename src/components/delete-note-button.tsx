'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteNote } from '@/lib/actions/notes'
import { Button } from '@/components/ui/button'

export function DeleteNoteButton({ noteId, deckId }: { noteId: string; deckId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('Удалить нот и все его карточки?')) return
    setLoading(true)
    try {
      await deleteNote(noteId, deckId)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleDelete} disabled={loading}
      className="text-destructive hover:text-destructive">
      {loading ? '...' : 'Удалить'}
    </Button>
  )
}
