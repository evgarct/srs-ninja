'use server'

import { createClient } from '@/lib/supabase/server'
import {
  approveDraftNoteForUser,
  listDraftBatchesForUser,
  listDraftNotesForUser,
  saveDraftNotesForUser,
  type DraftBatchMetadata,
} from '@/lib/draft-import-service'
import type { DraftCandidateInput } from '@/lib/draft-import'

export async function saveDraftNotes(
  deckId: string,
  items: DraftCandidateInput[],
  metadata: DraftBatchMetadata = {}
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  return saveDraftNotesForUser(supabase, user.id, deckId, items, metadata)
}

export async function getDraftBatches(deckId?: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  return listDraftBatchesForUser(supabase, user.id, deckId)
}

export async function getDraftNotes(options: { deckId?: string; batchId?: string } = {}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  return listDraftNotesForUser(supabase, user.id, options)
}

export async function approveDraftNote(noteId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  return approveDraftNoteForUser(supabase, user.id, noteId)
}
