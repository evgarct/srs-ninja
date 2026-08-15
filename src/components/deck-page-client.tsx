'use client'

import { useMemo, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button, buttonVariants } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Spinner } from '@/components/ui/spinner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { PendingLink } from '@/components/pending-link'
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
  getVisibleSelectionState,
  isFsrsState,
  toggleNoteIdSelection,
  type AudioFilter,
  type DeckNoteRow,
  type FsrsState,
} from '@/lib/deck-notes'
import type { Language } from '@/lib/types'
import { buildReviewSessionHref } from '@/lib/review-session-route'
import { supportsTtsLanguage } from '@/lib/tts-config'
import { deleteNotes } from '@/lib/actions/notes'
import { cn } from '@/lib/utils'

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
  const t = useTranslations('deck')
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
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

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
  const {
    allSelected: allVisibleSelected,
    indeterminate: someVisibleSelected,
  } = getVisibleSelectionState(selectedNoteIds, visibleNoteIds)

  const manualReviewHref = useMemo(() => {
    return buildReviewSessionHref(deckId, {
      mode: 'manual',
      tags: activeTags,
      states: activeStates,
      audio: activeAudioFilter,
    })
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
    setSelectedNoteIds(new Set())
    setActiveTags(nextTags)
    setActiveStates(nextStates)
    setActiveAudioFilter(nextAudioFilter)
    syncUrl(nextTags, nextStates, nextAudioFilter)
  }

  function toggleNoteSelection(noteId: string) {
    setSelectedNoteIds((current) => toggleNoteIdSelection(current, noteId))
  }

  function toggleAllVisible() {
    setSelectedNoteIds(allVisibleSelected ? new Set() : new Set(visibleNoteIds))
  }

  async function handleBulkDelete() {
    if (selectedNoteIds.size === 0) return
    setIsBulkDeleting(true)
    try {
      const { deletedIds } = await deleteNotes([...selectedNoteIds], deckId)
      const deleted = new Set(deletedIds)
      setNotes((current) => current.filter((note) => !deleted.has(note.id)))
      setAudioMap((current) =>
        Object.fromEntries(Object.entries(current).filter(([noteId]) => !deleted.has(noteId)))
      )
      setSelectedNoteIds(new Set())
      setDeleteDialogOpen(false)
      toast.success(t('bulkDeleteSuccess', { count: deletedIds.length }))
      refreshServerSnapshot()
    } catch {
      toast.error(t('bulkDeleteError'))
    } finally {
      setIsBulkDeleting(false)
    }
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
        <PendingLink href="/" pendingLabel={t('navigating')} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
          {t('backHome')}
        </PendingLink>
      </div>

      <div className="flex flex-col gap-4 mb-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{deckName}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {totalNotes} {t('notes')} · {totalCards} {t('cards')} · {dueCards} {t('dueForReview')}
            {draftNotes > 0 ? ` · ${draftNotes} ${t('drafts').toLowerCase()}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {draftNotes > 0 && (
            <PendingLink href={`/deck/${deckId}/drafts`} pendingLabel={t('navigating')} className={buttonVariants({ variant: 'outline' })}>
              {t('drafts')} ({draftNotes})
            </PendingLink>
          )}
          {dueCards > 0 && (
            <PendingLink href={buildReviewSessionHref(deckId)} pendingLabel={t('navigating')} className={buttonVariants()}>
              {t('study')} ({dueCards})
            </PendingLink>
          )}
          {visibleCardCount > 0 ? (
            <PendingLink
              href={manualReviewHref}
              pendingLabel={t('navigating')}
              className={buttonVariants({ variant: 'secondary' })}
            >
              {t('practiceVisible')} ({visibleCardCount})
            </PendingLink>
          ) : (
            <Button variant="secondary" disabled>
              {t('practiceVisible')} (0)
            </Button>
          )}
          {supportsTtsLanguage(deckLanguage) && (
            <GenerateAudioButton
              deckId={deckId}
              noteIds={visibleNoteIds}
              pendingCount={pendingAudioCount}
              onComplete={handleBatchAudioComplete}
            />
          )}
          <PendingLink href={`/notes/new?deckId=${deckId}`} pendingLabel={t('navigating')} className={buttonVariants({ variant: 'outline' })}>
            {t('addNote')}
          </PendingLink>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg mb-2">{t('noNotes')}</p>
          <p className="text-sm">{t('noNotesHint')}</p>
          <div className="flex gap-2 justify-center mt-4">
            <PendingLink href={`/notes/new?deckId=${deckId}`} pendingLabel={t('navigating')} className={buttonVariants({ variant: 'outline' })}>
              {t('addNoteBtn')}
            </PendingLink>
            <PendingLink href="/import" pendingLabel={t('navigating')} className={buttonVariants({ variant: 'outline' })}>
              {t('importAnki')}
            </PendingLink>
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
                <p className="text-sm font-medium">{t('notesTable')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('showing', { count: visibleNotes.length, cards: visibleCardCount })}
                </p>
              </div>
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={selectedNoteIds.size === 0}
                    />
                  }
                >
                  <Trash2 data-icon="inline-start" />
                  {t('deleteSelected', { count: selectedNoteIds.size })}
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('bulkDeleteTitle', { count: selectedNoteIds.size })}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('bulkDeleteDescription', { count: selectedNoteIds.size })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isBulkDeleting}>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      disabled={isBulkDeleting}
                      onClick={() => void handleBulkDelete()}
                    >
                      {isBulkDeleting ? <Spinner data-icon="inline-start" /> : <Trash2 data-icon="inline-start" />}
                      {isBulkDeleting ? t('deleting') : t('confirmDelete')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[1180px] w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr className="border-b">
                    <th className="w-12 px-4 py-3 font-medium">
                      <Checkbox
                        checked={allVisibleSelected}
                        indeterminate={someVisibleSelected}
                        onCheckedChange={toggleAllVisible}
                        disabled={visibleNotes.length === 0}
                        aria-label={t('selectAllVisible')}
                      />
                    </th>
                    <th className="px-4 py-3 font-medium">Audio</th>
                    <th className="px-4 py-3 font-medium">Word</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleNotes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                        {t('noNotesFiltered')}
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
                        <tr key={note.id} className={cn('border-b align-top hover:bg-muted/20', selectedNoteIds.has(note.id) && 'bg-muted/30')}>
                          <td className="px-4 py-3">
                            <Checkbox
                              checked={selectedNoteIds.has(note.id)}
                              onCheckedChange={() => toggleNoteSelection(note.id)}
                              aria-label={t('selectNote', { word })}
                            />
                          </td>
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
                                  triggerLabel={t('showCard')}
                                  trigger={
                                    <Button variant="ghost" size="icon" title={t('showCard')} aria-label={t('showCard')}>
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
                                    <Button variant="ghost" size="icon" title={t('editNote')} aria-label={t('editNote')}>
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                  }
                                />
                                <DeleteNoteButton
                                  noteId={note.id}
                                  deckId={deckId}
                                  onDeleted={() => handleNoteDeleted(note.id)}
                                  iconOnly
                                  title={t('deleteNote')}
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
