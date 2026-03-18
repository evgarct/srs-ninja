'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { GenerateAudioButton } from '@/components/generate-audio-button'
import { NoteEditSheet } from '@/components/note-edit-sheet'
import { DeleteNoteButton } from '@/components/delete-note-button'
import { PlayButton } from '@/components/flashcard/PlayButton'
import { getNoteTitle } from '@/lib/note-fields'
import { playAudioUrl } from '@/lib/audio'
import type { Language } from '@/lib/types'
import { cn } from '@/lib/utils'

type NoteCard = {
  id: string
  card_type: string
  state: string
}

type DeckNote = {
  id: string
  fields: Record<string, string>
  cards: NoteCard[]
}

type BatchResult = {
  total: number
  generated: number
  skipped: number
  errors: number
  generatedAudio?: Array<{ noteId: string; audioUrl: string }>
}

interface DeckPageClientProps {
  deckId: string
  deckName: string
  deckLanguage: Language
  dueCards: number
  totalCards: number
  totalNotes: number
  initialNotes: DeckNote[]
  initialAudioMap: Record<string, string>
  initialFilter?: string
}

export function DeckPageClient({
  deckId,
  deckName,
  deckLanguage,
  dueCards,
  totalCards,
  totalNotes,
  initialNotes,
  initialAudioMap,
  initialFilter,
}: DeckPageClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isRefreshing, startRefreshTransition] = useTransition()
  const [notes, setNotes] = useState(initialNotes)
  const [audioMap, setAudioMap] = useState(initialAudioMap)
  const [activeFilter, setActiveFilter] = useState<'all' | 'no-audio'>(
    initialFilter === 'no-audio' ? 'no-audio' : 'all'
  )

  const withoutAudioCount = useMemo(
    () => notes.filter((note) => !audioMap[note.id]).length,
    [notes, audioMap]
  )

  const visibleNotes = useMemo(
    () => (activeFilter === 'no-audio' ? notes.filter((note) => !audioMap[note.id]) : notes),
    [activeFilter, notes, audioMap]
  )

  function syncUrlFilter(nextFilter: 'all' | 'no-audio') {
    const params = new URLSearchParams(searchParams.toString())
    if (nextFilter === 'no-audio') {
      params.set('filter', 'no-audio')
    } else {
      params.delete('filter')
    }

    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  function setFilter(nextFilter: 'all' | 'no-audio') {
    setActiveFilter(nextFilter)
    syncUrlFilter(nextFilter)
  }

  function refreshServerSnapshot() {
    startRefreshTransition(() => {
      router.refresh()
    })
  }

  function handleNoteSaveSuccess(
    noteId: string,
    updatedFields: Record<string, string>,
    audioUrl?: string
  ) {
    setNotes((prev) =>
      prev.map((note) => (note.id === noteId ? { ...note, fields: updatedFields } : note))
    )

    if (audioUrl) {
      setAudioMap((prev) => ({ ...prev, [noteId]: audioUrl }))
    }

    refreshServerSnapshot()
  }

  function handleBatchAudioComplete(result: BatchResult) {
    const generatedAudio = result.generatedAudio ?? []
    if (generatedAudio.length > 0) {
      setAudioMap((prev) => ({
        ...prev,
        ...Object.fromEntries(generatedAudio.map(({ noteId, audioUrl }) => [noteId, audioUrl])),
      }))
    }

    refreshServerSnapshot()
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-1">
        <Link href="/" className="text-muted-foreground hover:text-foreground text-sm">
          ← Главная
        </Link>
      </div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{deckName}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {totalNotes} нотов · {totalCards} карточек · {dueCards} к повторению
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {dueCards > 0 && (
            <Link href={`/review/${deckId}`} className={buttonVariants()}>
              Учить ({dueCards})
            </Link>
          )}
          {deckLanguage === 'english' && (
            <GenerateAudioButton deckId={deckId} onComplete={handleBatchAudioComplete} />
          )}
          <Link href={`/notes/new?deckId=${deckId}`} className={buttonVariants({ variant: 'outline' })}>
            + Нот
          </Link>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg mb-2">Нет нотов</p>
          <p className="text-sm">Добавьте первый нот или импортируйте из Anki</p>
          <div className="flex gap-2 justify-center mt-4">
            <Link href={`/notes/new?deckId=${deckId}`} className={buttonVariants({ variant: 'outline' })}>
              Добавить нот
            </Link>
            <Link href="/import" className={buttonVariants({ variant: 'outline' })}>
              Импорт из Anki
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilter('all')}
              className={cn(
                !activeFilter || activeFilter === 'all'
                  ? 'bg-foreground text-background hover:bg-foreground/90'
                  : undefined
              )}
            >
              Все ({notes.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilter('no-audio')}
              className={cn(
                activeFilter === 'no-audio'
                  ? 'bg-foreground text-background hover:bg-foreground/90'
                  : undefined
              )}
            >
              Без аудио ({withoutAudioCount})
            </Button>
            {isRefreshing && <span className="text-xs text-muted-foreground">Синхронизация…</span>}
          </div>

          <div className="space-y-2">
            {visibleNotes.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">
                У всех нотов уже есть аудио 🔊
              </p>
            ) : (
              visibleNotes.map((note) => {
                const title = getNoteTitle(note.fields)
                const audioUrl = audioMap[note.id]
                const hasAudio = Boolean(audioUrl)

                return (
                  <div
                    key={note.id}
                    className="group flex items-center justify-between p-3 rounded-lg border hover:border-foreground/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {hasAudio && <span className="text-sm shrink-0" title="Audio available">🔊</span>}
                        <p className="font-medium truncate">{title}</p>
                      </div>
                      <div className="flex gap-1 mt-1">
                        {note.fields.level && (
                          <Badge variant="outline" className="text-xs">
                            {note.fields.level}
                          </Badge>
                        )}
                        {note.fields.part_of_speech && (
                          <Badge variant="outline" className="text-xs">
                            {note.fields.part_of_speech}
                          </Badge>
                        )}
                        {note.cards.map((card) => (
                          <Badge
                            key={card.id}
                            variant={card.state === 'new' ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {card.card_type === 'recognition' ? '👁' : '✍️'} {card.state}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-3 shrink-0">
                      {audioUrl && (
                        <PlayButton
                          onPlay={() => {
                            void playAudioUrl(audioUrl)
                          }}
                          className="h-8 w-8"
                        />
                      )}
                      <NoteEditSheet
                        noteId={note.id}
                        deckId={deckId}
                        language={deckLanguage}
                        initialFields={note.fields}
                        initialAudioUrl={audioUrl}
                        onSaveSuccess={(updatedFields, nextAudioUrl) => {
                          handleNoteSaveSuccess(note.id, updatedFields, nextAudioUrl)
                        }}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Edit Note"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        }
                      />
                      <DeleteNoteButton noteId={note.id} deckId={deckId} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}
    </main>
  )
}
