import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateAndCacheAudio } from '@/lib/tts'
import { summarizeBatchAudioResults, type BatchAudioResult } from '@/lib/tts-batch'
import { getNotePrimaryText } from '@/lib/note-fields'
import { supportsTtsLanguage } from '@/lib/tts-config'

// POST /api/tts/batch  { deckId, noteIds? }
// Generates audio for filtered supported-language notes in a deck that don't have audio yet.
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { deckId, noteIds } = (await request.json()) as { deckId?: string; noteIds?: string[] }
  if (!deckId) return NextResponse.json({ error: 'Missing deckId' }, { status: 400 })

  const { data: deck } = await supabase
    .from('decks')
    .select('language')
    .eq('id', deckId)
    .eq('user_id', user.id)
    .single()

  if (!deck) return NextResponse.json({ error: 'Deck not found' }, { status: 404 })
  if (!supportsTtsLanguage(deck.language)) {
    return NextResponse.json(
      { error: `TTS is not supported for ${deck.language} decks` },
      { status: 400 }
    )
  }

  // Fetch all notes for the deck
  let notesQuery = supabase
    .from('notes')
    .select('id, fields')
    .eq('deck_id', deckId)
    .eq('user_id', user.id)

  if (noteIds && noteIds.length > 0) {
    notesQuery = notesQuery.in('id', noteIds)
  }

  const { data: notes, error: notesError } = await notesQuery

  if (notesError || !notes) {
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }

  if (notes.length === 0) {
    return NextResponse.json({
      total: 0,
      generated: 0,
      skipped: 0,
      errors: 0,
      generatedAudio: [],
    })
  }

  // Find which notes already have audio
  const fetchedNoteIds = notes.map((n) => n.id)
  const { data: existingAudio } = await supabase
    .from('audio_cache')
    .select('note_id')
    .in('note_id', fetchedNoteIds)
    .eq('field_key', 'expression')

  const cachedIds = new Set(existingAudio?.map((a) => a.note_id) ?? [])
  const pending = notes.filter((n) => !cachedIds.has(n.id))

  const results: BatchAudioResult[] = []

  for (const note of pending) {
    const fields = note.fields as Record<string, unknown>
    const expression = getNotePrimaryText(fields) || null
    if (!expression) {
      results.push({ noteId: note.id, status: 'skip' })
      continue
    }

    const result = await generateAndCacheAudio(
      supabase,
      user.id,
      note.id,
      expression,
      deck.language
    )

    results.push({
      noteId: note.id,
      status: 'error' in result ? 'error' : 'ok',
      audioUrl: 'audioUrl' in result ? result.audioUrl : undefined,
      error: 'error' in result ? result.error : undefined,
    })

    // Rate limit: 500ms between ElevenLabs requests
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  const summary = summarizeBatchAudioResults(results)
  return NextResponse.json(summary.body, { status: summary.status })
}
