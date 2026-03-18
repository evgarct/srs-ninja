'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { NoteEditorForm } from './note-editor-form'
import type { Language } from '@/lib/types'

interface NoteEditSheetProps {
  noteId: string
  deckId: string
  language: Language
  initialFields: Record<string, string>
  initialAudioUrl?: string
  allowAudioGeneration?: boolean
  trigger: React.ReactElement
  onSaveSuccess?: (updatedFields: Record<string, string>, audioUrl?: string) => void
}

export function NoteEditSheet({
  noteId,
  deckId,
  language,
  initialFields,
  initialAudioUrl,
  allowAudioGeneration = true,
  trigger,
  onSaveSuccess,
}: NoteEditSheetProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={trigger} />
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Flashcard Note</SheetTitle>
          <SheetDescription>
            Make changes to your flashcard note. Changes apply immediately upon saving.
          </SheetDescription>
        </SheetHeader>
        {open && (
          <div className="px-4 pb-4">
            <NoteEditorForm
              noteId={noteId}
              deckId={deckId}
              language={language}
              initialFields={initialFields}
              initialAudioUrl={initialAudioUrl}
              allowAudioGeneration={allowAudioGeneration}
              onSuccess={(fields, audio) => {
                setOpen(false)
                onSaveSuccess?.(fields, audio)
              }}
              onCancel={() => setOpen(false)}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
