import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { summarizeBatchAudioResults } from '@/lib/tts-batch'
import { DeckAudioError, generateDeckAudioForUser } from '@/lib/note-audio-service'

// POST /api/tts/batch  { deckId, noteIds? }
// Generates audio for filtered supported-language notes in a deck that don't have audio yet.
// The same service backs the MCP generate_note_audio tool.
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { deckId, noteIds } = (await request.json()) as { deckId?: string; noteIds?: string[] }
  if (!deckId) return NextResponse.json({ error: 'Missing deckId' }, { status: 400 })

  try {
    const { results } = await generateDeckAudioForUser(supabase, user.id, deckId, { noteIds })
    const summary = summarizeBatchAudioResults(results)
    return NextResponse.json(summary.body, { status: summary.status })
  } catch (error) {
    if (error instanceof DeckAudioError) return NextResponse.json({ error: error.message }, { status: error.status })
    throw error
  }
}
