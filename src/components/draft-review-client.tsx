'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { DraftStatusBadge } from '@/components/draft-status-badge'
import { ApproveDraftButton } from '@/components/approve-draft-button'
import { NoteEditSheet } from '@/components/note-edit-sheet'
import { getNotePrimaryText } from '@/lib/note-fields'
import type { Language } from '@/lib/types'
import type { Database } from '@/lib/supabase/database.types'

type ImportBatchRow = Database['public']['Tables']['import_batches']['Row']
type NoteRow = Database['public']['Tables']['notes']['Row']

interface DraftReviewClientProps {
  deckId: string
  deckName: string
  language: Language
  initialBatches: ImportBatchRow[]
  initialDraftNotes: NoteRow[]
  initialSelectedBatchId?: string
}

export function DraftReviewClient({
  deckId,
  deckName,
  language,
  initialBatches,
  initialDraftNotes,
  initialSelectedBatchId,
}: DraftReviewClientProps) {
  const [batches, setBatches] = useState(initialBatches)
  const [notes, setNotes] = useState(
    initialDraftNotes.map((note) => ({
      ...note,
      fields: note.fields as Record<string, string>,
      tags: note.tags ?? [],
    }))
  )
  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    initialSelectedBatchId && initialBatches.some((batch) => batch.id === initialSelectedBatchId)
      ? initialSelectedBatchId
      : 'all'
  )

  const visibleNotes = useMemo(
    () =>
      selectedBatchId === 'all'
        ? notes
        : notes.filter((note) => note.import_batch_id === selectedBatchId),
    [notes, selectedBatchId]
  )

  const currentBatch = selectedBatchId === 'all'
    ? null
    : batches.find((batch) => batch.id === selectedBatchId) ?? null

  function handleApproved(noteId: string) {
    const approvedNote = notes.find((note) => note.id === noteId)
    if (!approvedNote) return

    setNotes((prev) => prev.filter((note) => note.id !== noteId))

    if (!approvedNote.import_batch_id) return

    const remainingStatuses = notes
      .filter((note) => note.id !== noteId && note.import_batch_id === approvedNote.import_batch_id)
      .map(() => 'draft')

    setBatches((prev) =>
      prev
        .map((batch) =>
          batch.id === approvedNote.import_batch_id
            ? {
                ...batch,
                notes_count: Math.max(batch.notes_count - 1, 0),
                status: remainingStatuses.length === 0 ? 'approved' : 'partially_approved',
              }
            : batch
        )
        .filter((batch) => batch.status !== 'approved' || batch.notes_count > 0)
    )
  }

  function handleSaved(noteId: string, updatedFields: Record<string, string>) {
    setNotes((prev) =>
      prev.map((note) => (note.id === noteId ? { ...note, fields: updatedFields } : note))
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <Link href={`/deck/${deckId}`} className="text-muted-foreground hover:text-foreground text-sm">
            ← К колоде
          </Link>
          <h1 className="text-3xl font-bold mt-2">Draft imports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {deckName} · {notes.length} draft notes pending review
          </p>
        </div>

        <Link href={`/deck/${deckId}`} className={buttonVariants({ variant: 'outline' })}>
          Открыть колоду
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={selectedBatchId === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedBatchId('all')}
        >
          All drafts ({notes.length})
        </Button>
        {batches.map((batch) => {
          const batchPendingCount = notes.filter((note) => note.import_batch_id === batch.id).length
          return (
            <Button
              key={batch.id}
              variant={selectedBatchId === batch.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedBatchId(batch.id)}
            >
              Batch {batch.created_at.slice(0, 10)} ({batchPendingCount})
            </Button>
          )
        })}
      </div>

      {currentBatch && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-lg">Selected batch</CardTitle>
              <DraftStatusBadge status={currentBatch.status as 'draft' | 'partially_approved' | 'approved' | 'archived'} />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Source: {currentBatch.source}</p>
            {currentBatch.topic && <p>Topic: {currentBatch.topic}</p>}
            {currentBatch.model_name && <p>Model: {currentBatch.model_name}</p>}
            {currentBatch.requested_tags.length > 0 && (
              <p>Requested tags: {currentBatch.requested_tags.join(', ')}</p>
            )}
          </CardContent>
        </Card>
      )}

      {visibleNotes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Нет draft notes для текущего фильтра.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {visibleNotes.map((note) => {
            const word = getNotePrimaryText(note.fields) || '—'
            const translation = note.fields.translation || ''

            return (
              <Card key={note.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{word}</CardTitle>
                        <DraftStatusBadge status="draft" />
                      </div>
                      {translation && (
                        <p className="text-sm text-muted-foreground">{translation}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <NoteEditSheet
                        noteId={note.id}
                        deckId={deckId}
                        language={language}
                        initialFields={note.fields}
                        allowAudioGeneration={false}
                        trigger={
                          <Button variant="outline" size="sm">
                            <Pencil className="size-4" />
                            Edit
                          </Button>
                        }
                        onSaveSuccess={(updatedFields) => handleSaved(note.id, updatedFields)}
                      />
                      <ApproveDraftButton noteId={note.id} onApproved={handleApproved} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {note.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <dl className="grid gap-3 sm:grid-cols-2">
                    {Object.entries(note.fields)
                      .filter(([, value]) => value?.trim())
                      .map(([key, value]) => (
                        <div key={key} className="rounded-lg border p-3">
                          <dt className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                            {key}
                          </dt>
                          <dd className="text-sm whitespace-pre-wrap break-words">{value}</dd>
                        </div>
                      ))}
                  </dl>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </main>
  )
}
