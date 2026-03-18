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
  initialFields: Record<string, unknown>
  initialTags?: string[]
  initialAudioUrl?: string
  allowAudioGeneration?: boolean
  trigger: React.ReactElement
  onSaveSuccess?: (
    updatedFields: Record<string, unknown>,
    updatedTags: string[],
    audioUrl?: string,
    audioError?: string
  ) => void
}

export function NoteEditSheet({
  noteId,
  deckId,
  language,
  initialFields,
  initialTags = [],
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
              initialTags={initialTags}
              initialAudioUrl={initialAudioUrl}
              allowAudioGeneration={allowAudioGeneration}
              onSuccess={(fields, tags, audio, audioError) => {
                setOpen(false)
                onSaveSuccess?.(fields, tags, audio, audioError)
              }}
              onCancel={() => setOpen(false)}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
