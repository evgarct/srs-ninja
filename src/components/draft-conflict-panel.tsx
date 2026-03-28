'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getNotePrimaryText } from '@/lib/note-fields'
import type { DraftConflictMetadata } from '@/lib/draft-import'
import type { Language } from '@/lib/types'

interface DraftConflictNoteSummary {
  id: string
  fields: Record<string, unknown>
  tags: string[]
}

interface DraftConflictPanelProps {
  conflict: DraftConflictMetadata
  matchedNote?: DraftConflictNoteSummary | null
  language: Language
  onUpdateExisting: () => Promise<void> | void
  onKeepSeparate: () => Promise<void> | void
  onIgnoreMatch: () => Promise<void> | void
}

export function DraftConflictPanel({
  conflict,
  matchedNote,
  language,
  onUpdateExisting,
  onKeepSeparate,
  onIgnoreMatch,
}: DraftConflictPanelProps) {
  const [activeAction, setActiveAction] = useState<'update' | 'separate' | 'ignore' | null>(null)
  const matchedPrimaryText = matchedNote ? getNotePrimaryText(matchedNote.fields) : conflict.matchedPrimaryText
  const matchedTranslation = matchedNote && typeof matchedNote.fields.translation === 'string'
    ? matchedNote.fields.translation
    : ''
  const languageLabel = language === 'english' ? 'English' : 'Czech'

  async function runAction(
    action: 'update' | 'separate' | 'ignore',
    callback: () => Promise<void> | void
  ) {
    if (activeAction) return
    setActiveAction(action)
    try {
      await callback()
    } finally {
      setActiveAction(null)
    }
  }

  return (
    <Card className="border-amber-500/40 bg-amber-500/5">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">Similar note conflict</CardTitle>
          <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300">
            {Math.round(conflict.similarityScore * 100)}% match
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-3 rounded-lg border bg-background/80 p-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Matched note
            </p>
            <p className="font-medium">{matchedPrimaryText || conflict.matchedPrimaryText}</p>
            {matchedTranslation && <p className="text-muted-foreground">{matchedTranslation}</p>}
            {matchedNote && matchedNote.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {matchedNote.tags.slice(0, 4).map((tag) => (
                  <Badge key={tag} variant="secondary" className="h-auto px-2 py-0.5 text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Deck language: {languageLabel}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Conflict metadata
            </p>
            <p className="text-muted-foreground">
              This draft matches an existing note closely enough that it should be reviewed before approval.
            </p>
            <p className="text-xs text-muted-foreground">
              Existing note id: <span className="font-mono">{conflict.matchedNoteId}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            onClick={() => {
              void runAction('update', onUpdateExisting)
            }}
            disabled={activeAction !== null}
          >
            {activeAction === 'update' ? 'Updating...' : 'Update existing'}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              void runAction('separate', onKeepSeparate)
            }}
            disabled={activeAction !== null}
          >
            {activeAction === 'separate' ? 'Saving...' : 'Keep as separate draft'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              void runAction('ignore', onIgnoreMatch)
            }}
            disabled={activeAction !== null}
          >
            {activeAction === 'ignore' ? 'Ignoring...' : 'Ignore match'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
