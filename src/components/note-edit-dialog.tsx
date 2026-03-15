'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { NoteEditorForm } from './note-editor-form'
import type { Language } from '@/lib/types'

interface NoteEditDialogProps {
  noteId: string
  deckId: string
  language: Language
  initialFields: Record<string, string>
  trigger: React.ReactElement
}

export function NoteEditDialog({
  noteId,
  deckId,
  language,
  initialFields,
  trigger,
}: NoteEditDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Note</DialogTitle>
          <DialogDescription>
            Make changes to your flashcard note here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <NoteEditorForm
          noteId={noteId}
          deckId={deckId}
          language={language}
          initialFields={initialFields}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
