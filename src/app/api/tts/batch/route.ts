import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateAndCacheAudio } from '@/lib/tts'
import { getNotePrimaryText } from '@/lib/note-fields'

// POST /api/tts/batch  { deckId }
// Generates audio for all English notes in a deck that don't have audio yet.
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { deckId } = (await request.json()) as { deckId?: string }
  if (!deckId) return NextResponse.json({ error: 'Missing deckId' }, { status: 400 })

  // Guard: English decks only
  const { data: deck } = await supabase
    .from('decks')
    .select('language')
    .eq('id', deckId)
    .eq('user_id', user.id)
    .single()

  if (!deck) return NextResponse.json({ error: 'Deck not found' }, { status: 404 })
  if (deck.language !== 'english') {
    return NextResponse.json({ error: 'TTS is only supported for English decks' }, { status: 400 })
  }

  // Fetch all notes for the deck
  const { data: notes, error: notesError } = await supabase
    .from('notes')
    .select('id, fields')
    .eq('deck_id', deckId)
    .eq('user_id', user.id)

  if (notesError || !notes) {
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }

  // Find which notes already have audio
  const noteIds = notes.map((n) => n.id)
  const { data: existingAudio } = await supabase
    .from('audio_cache')
    .select('note_id')
    .in('note_id', noteIds)

  const cachedIds = new Set(existingAudio?.map((a) => a.note_id) ?? [])
  const pending = notes.filter((n) => !cachedIds.has(n.id))

  const results: { noteId: string; status: 'ok' | 'skip' | 'error'; audioUrl?: string }[] = []

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
    })

    // Rate limit: 500ms between ElevenLabs requests
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  return NextResponse.json({
    total: pending.length,
    generated: results.filter((r) => r.status === 'ok').length,
    skipped: results.filter((r) => r.status === 'skip').length,
    errors: results.filter((r) => r.status === 'error').length,
    generatedAudio: results
      .filter((r) => r.status === 'ok' && r.audioUrl)
      .map((r) => ({ noteId: r.noteId, audioUrl: r.audioUrl! })),
  })
}
