'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Eye, Pencil } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { GenerateAudioButton } from '@/components/generate-audio-button'
import { NoteEditSheet } from '@/components/note-edit-sheet'
import { DeleteNoteButton } from '@/components/delete-note-button'
import { PlayButton } from '@/components/flashcard/PlayButton'
import { DeckCardPreviewDialog } from '@/components/deck-card-preview-dialog'
import { DeckFiltersBar } from '@/components/deck-filters-bar'
import { DeckStatusBadge } from '@/components/deck-status-badge'
import { getNotePrimaryText } from '@/lib/note-fields'
import { playAudioUrl } from '@/lib/audio'
import {
  filterDeckNotes,
  getAllDeckTags,
  getNoteMemoryScore,
  getNoteFsrsState,
  isFsrsState,
  type AudioFilter,
  type DeckNoteRow,
  type FsrsState,
} from '@/lib/deck-notes'
import type { Language } from '@/lib/types'

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
  draftNotes: number
  initialNotes: DeckNoteRow[]
  initialAudioMap: Record<string, string>
  initialTagFilter?: string
  initialStateFilter?: string
  initialAudioFilter?: AudioFilter
}

const FSRS_FILTERS: FsrsState[] = ['new', 'learning', 'relearning', 'review']

export function DeckPageClient({
  deckId,
  deckName,
  deckLanguage,
  dueCards,
  totalCards,
  totalNotes,
  draftNotes,
  initialNotes,
  initialAudioMap,
  initialTagFilter,
  initialStateFilter,
  initialAudioFilter = 'all',
}: DeckPageClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isRefreshing, startRefreshTransition] = useTransition()
  const [notes, setNotes] = useState(initialNotes)
  const [audioMap, setAudioMap] = useState(initialAudioMap)
  const [tagQuery, setTagQuery] = useState('')
  const [activeTags, setActiveTags] = useState<string[]>(
    (initialTagFilter ?? '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
  )
  const [activeStates, setActiveStates] = useState<FsrsState[]>(
    (initialStateFilter ?? '')
      .split(',')
      .map((state) => state.trim())
      .filter(isFsrsState) as FsrsState[]
  )
  const [activeAudioFilter, setActiveAudioFilter] = useState<AudioFilter>(initialAudioFilter)

  const availableTags = useMemo(() => getAllDeckTags(notes), [notes])
  const visibleNotes = useMemo(
    () =>
      filterDeckNotes(notes, {
        tagFilters: activeTags,
        stateFilters: activeStates,
        audioFilter: activeAudioFilter,
      }, audioMap),
    [notes, activeTags, activeStates, activeAudioFilter, audioMap]
  )

  const visibleCardCount = useMemo(
    () => visibleNotes.reduce((sum, note) => sum + note.cards.length, 0),
    [visibleNotes]
  )
  const visibleNoteIds = useMemo(
    () => visibleNotes.map((note) => note.id),
    [visibleNotes]
  )
  const pendingAudioCount = useMemo(
    () => visibleNotes.filter((note) => !audioMap[note.id]).length,
    [visibleNotes, audioMap]
  )

  const manualReviewHref = useMemo(() => {
    const params = new URLSearchParams()
    params.set('mode', 'manual')
    if (activeTags.length > 0) {
      params.set('tags', activeTags.join(','))
    }
    if (activeStates.length > 0) {
      params.set('state', activeStates.join(','))
    }
    if (activeAudioFilter !== 'all') {
      params.set('audio', activeAudioFilter)
    }
    return `/review/${deckId}?${params.toString()}`
  }, [deckId, activeTags, activeStates, activeAudioFilter])

  function syncUrl(nextTags: string[], nextStates: FsrsState[], nextAudioFilter: AudioFilter) {
    const params = new URLSearchParams(searchParams.toString())

    if (nextTags.length > 0) {
      params.set('tags', nextTags.join(','))
    } else {
      params.delete('tags')
    }

    if (nextStates.length > 0) {
      params.set('state', nextStates.join(','))
    } else {
      params.delete('state')
    }

    if (nextAudioFilter !== 'all') {
      params.set('audio', nextAudioFilter)
    } else {
      params.delete('audio')
    }

    params.delete('filter')

    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  function updateFilters(
    nextTags: string[],
    nextStates: FsrsState[],
    nextAudioFilter: AudioFilter = activeAudioFilter
  ) {
    setActiveTags(nextTags)
    setActiveStates(nextStates)
    setActiveAudioFilter(nextAudioFilter)
    syncUrl(nextTags, nextStates, nextAudioFilter)
  }

  function toggleTag(tag: string) {
    const nextTags = activeTags.includes(tag)
      ? activeTags.filter((current) => current !== tag)
      : [...activeTags, tag]
    updateFilters(nextTags, activeStates)
  }

  function toggleState(state: FsrsState) {
    const nextStates = activeStates.includes(state)
      ? activeStates.filter((current) => current !== state)
      : [...activeStates, state]
    updateFilters(activeTags, nextStates)
  }

  function clearTagSearchAndFilter() {
    setTagQuery('')
    updateFilters([], activeStates)
  }

  function refreshServerSnapshot() {
    startRefreshTransition(() => {
      router.refresh()
    })
  }

  function handleNoteSaveSuccess(
    noteId: string,
    updatedFields: Record<string, unknown>,
    updatedTags: string[],
    audioUrl?: string
  ) {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === noteId ? { ...note, fields: updatedFields, tags: updatedTags } : note
      )
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

  function handleNoteDeleted(noteId: string) {
    setNotes((prev) => prev.filter((note) => note.id !== noteId))
    setAudioMap((prev) => {
      const next = { ...prev }
      delete next[noteId]
      return next
    })
  }

  return (
    <main className="w-full px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-1">
        <Link href="/" className="text-muted-foreground hover:text-foreground text-sm">
          ← Главная
        </Link>
      </div>

      <div className="flex flex-col gap-4 mb-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{deckName}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {totalNotes} нотов · {totalCards} карточек · {dueCards} к повторению
            {draftNotes > 0 ? ` · ${draftNotes} draft` : ''}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {draftNotes > 0 && (
            <Link href={`/deck/${deckId}/drafts`} className={buttonVariants({ variant: 'outline' })}>
              Drafts ({draftNotes})
            </Link>
          )}
          {dueCards > 0 && (
            <Link href={`/review/${deckId}`} className={buttonVariants()}>
              Учить ({dueCards})
            </Link>
          )}
          {visibleCardCount > 0 ? (
            <Link
              href={manualReviewHref}
              className={buttonVariants({ variant: 'secondary' })}
            >
              Тренировать показанные ({visibleCardCount})
            </Link>
          ) : (
            <Button variant="secondary" disabled>
              Тренировать показанные (0)
            </Button>
          )}
          {deckLanguage === 'english' && (
            <GenerateAudioButton
              deckId={deckId}
              noteIds={visibleNoteIds}
              pendingCount={pendingAudioCount}
              onComplete={handleBatchAudioComplete}
            />
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
        <div className="space-y-5">
          <DeckFiltersBar
            deckLanguage={deckLanguage}
            availableTags={availableTags}
            tagQuery={tagQuery}
            activeTags={activeTags}
            activeStates={activeStates}
            activeAudioFilter={activeAudioFilter}
            fsrsFilters={FSRS_FILTERS}
            isRefreshing={isRefreshing}
            onTagQueryChange={setTagQuery}
            onClearTagSearchAndFilter={clearTagSearchAndFilter}
            onResetTags={() => updateFilters([], activeStates)}
            onToggleTag={toggleTag}
            onResetStates={() => updateFilters(activeTags, [])}
            onToggleState={toggleState}
            onAudioFilterChange={(filter) => updateFilters(activeTags, activeStates, filter)}
          />

          <section className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
              <div>
                <p className="text-sm font-medium">Таблица нотов</p>
                <p className="text-xs text-muted-foreground">
                  Показано {visibleNotes.length} нотов · {visibleCardCount} карточек
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[1180px] w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr className="border-b">
                    <th className="px-4 py-3 font-medium">Audio</th>
                    <th className="px-4 py-3 font-medium">Word</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleNotes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                        По текущему фильтру ничего не найдено
                      </td>
                    </tr>
                  ) : (
                    visibleNotes.map((note) => {
                      const word = getNotePrimaryText(note.fields) || '—'
                      const translation = typeof note.fields.translation === 'string'
                        ? note.fields.translation
                        : ''
                      const audioUrl = audioMap[note.id]
                      const aggregateState = getNoteFsrsState(note.cards)
                      const memoryScore = getNoteMemoryScore(note.cards)

                      return (
                        <tr key={note.id} className="border-b align-top hover:bg-muted/20">
                          <td className="px-4 py-3">
                            {audioUrl ? (
                              <PlayButton
                                onPlay={() => {
                                  void playAudioUrl(audioUrl)
                                }}
                                className="h-8 w-8"
                              />
                            ) : null}
                          </td>
                          <td className="px-4 py-3 min-w-[280px]">
                            <div className="space-y-1">
                              <p className="font-medium text-base leading-tight">{word}</p>
                              {translation && (
                                <p className="text-xs text-muted-foreground">{translation}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 min-w-[250px]">
                            <DeckStatusBadge state={aggregateState} memoryScore={memoryScore} />
                          </td>
                          <td className="px-4 py-3">
                              <div className="flex flex-nowrap justify-end gap-1">
                                <DeckCardPreviewDialog
                                  fields={note.fields}
                                  audioUrl={audioUrl}
                                  language={deckLanguage}
                                  triggerLabel="Показать карточку"
                                  trigger={
                                    <Button variant="ghost" size="icon" title="Показать карточку" aria-label="Показать карточку">
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  }
                                />
                                <NoteEditSheet
                                noteId={note.id}
                                deckId={deckId}
                                language={deckLanguage}
                                initialFields={note.fields}
                                initialTags={note.tags}
                                initialAudioUrl={audioUrl}
                                onSaveSuccess={(updatedFields, updatedTags, nextAudioUrl) => {
                                    handleNoteSaveSuccess(
                                      note.id,
                                      updatedFields,
                                      updatedTags,
                                      nextAudioUrl
                                    )
                                  }}
                                  trigger={
                                    <Button variant="ghost" size="icon" title="Редактировать" aria-label="Редактировать">
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                  }
                                />
                                <DeleteNoteButton
                                  noteId={note.id}
                                  deckId={deckId}
                                  onDeleted={() => handleNoteDeleted(note.id)}
                                  iconOnly
                                  title="Удалить"
                                />
                              </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
