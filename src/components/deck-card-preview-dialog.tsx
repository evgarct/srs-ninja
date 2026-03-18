'use client'

import { useState } from 'react'
import { FlipHorizontal2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Flashcard } from '@/components/flashcard'
import { playAudioUrl } from '@/lib/audio'
import { mapFieldsToFlashcard } from '@/lib/flashcard-mapping'
import type { Language } from '@/lib/types'

interface DeckCardPreviewDialogProps {
  fields: Record<string, string>
  audioUrl?: string
  language: Language
  triggerLabel: string
  trigger?: React.ReactElement
}

export function DeckCardPreviewDialog({
  fields,
  audioUrl,
  language,
  triggerLabel,
  trigger,
}: DeckCardPreviewDialogProps) {
  const [open, setOpen] = useState(false)
  const [side, setSide] = useState<'front' | 'back'>('front')
  const flashcardProps = mapFieldsToFlashcard(fields, language)
  const description =
    side === 'front'
      ? 'Предпросмотр лицевой стороны карточки'
      : 'Предпросмотр обратной стороны карточки'

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) {
          setSide('front')
        }
      }}
    >
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : (
        <DialogTrigger
          render={
            <Button variant="ghost" size="sm" />
          }
        >
          {triggerLabel}
        </DialogTrigger>
      )}
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:max-w-[min(760px,calc(100vw-3rem))] p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-0 md:p-6 md:pb-0">
          <div className="flex items-start justify-between gap-4 pr-10">
            <div>
              <DialogTitle>{triggerLabel}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSide((current) => (current === 'front' ? 'back' : 'front'))}
            >
              <FlipHorizontal2 className="w-4 h-4" />
              {side === 'front' ? 'Показать оборот' : 'Показать лицо'}
            </Button>
          </div>
        </DialogHeader>
        <div className="flex justify-center p-5 md:p-6 lg:p-7">
          <Flashcard
            {...flashcardProps}
            className="w-full max-w-[560px]"
            language={language}
            direction="recognition"
            isRevealed={side === 'back'}
            previewMode
            audioUrl={audioUrl}
            onPlayAudio={audioUrl ? () => void playAudioUrl(audioUrl) : undefined}
            onReveal={() => {}}
            onRate={() => {}}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
