import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  listDraftNotesForUser,
  saveDraftNotesForUser,
  type DraftBatchMetadata,
} from '@/lib/draft-import-service'
import type { DraftCandidateInput } from '@/lib/draft-import'

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const deckId = url.searchParams.get('deckId') ?? undefined
  const batchId = url.searchParams.get('batchId') ?? undefined

  try {
    const notes = await listDraftNotesForUser(supabase, user.id, { deckId, batchId })
    return NextResponse.json({ notes })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch draft notes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json()) as {
    deckId?: string
    items?: DraftCandidateInput[]
    metadata?: DraftBatchMetadata
  }

  if (!body.deckId || !Array.isArray(body.items)) {
    return NextResponse.json({ error: 'Missing deckId or items' }, { status: 400 })
  }

  try {
    const result = await saveDraftNotesForUser(
      supabase,
      user.id,
      body.deckId,
      body.items,
      body.metadata ?? {}
    )
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save draft notes' },
      { status: 500 }
    )
  }
}
