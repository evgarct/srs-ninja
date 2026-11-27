import type { SupabaseClient } from '@supabase/supabase-js'
import { generateAndCacheAudio } from '@/lib/tts'
import type { BatchAudioResult } from '@/lib/tts-batch'
import { getNotePrimaryText } from '@/lib/note-fields'
import { supportsTtsLanguage } from '@/lib/tts-config'
import { resolveValidatedElevenLabsTts } from '@/lib/server/elevenlabs-account'

const AUDIO_ID_CHUNK = 100

export class DeckAudioError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
    this.name = 'DeckAudioError'
  }
}

/** noteId → cached expression audio URL, for the notes that have one. */
export async function getAudioMapForNotes(supabase: SupabaseClient, noteIds: string[]) {
  const map: Record<string, string> = {}
  for (let index = 0; index < noteIds.length; index += AUDIO_ID_CHUNK) {
    const ids = noteIds.slice(index, index + AUDIO_ID_CHUNK)
    const { data, error } = await supabase.from('audio_cache').select('note_id, storage_path').in('note_id', ids).eq('field_key', 'expression')
    if (error) throw error
    for (const row of (data ?? []) as Array<{ note_id: string; storage_path: string }>) map[row.note_id] = row.storage_path
  }
  return map
}

export interface DeckAudioOptions {
  noteIds?: string[]
  /** Regenerate audio that already exists (the web editor's "regenerate" button). */
  force?: boolean
  /** Maximum notes to voice in this call; the rest is reported as remaining. */
  limit?: number
  delayMs?: number
}

/**
 * Voices a deck's notes with the user's ElevenLabs voice: by default only notes without audio
 * (the deck page's "Generate audio" button, POST /api/tts/batch). Shared by that route and MCP.
 */
export async function generateDeckAudioForUser(supabase: SupabaseClient, userId: string, deckId: string, options: DeckAudioOptions = {}) {
  const { data: deck } = await supabase.from('decks').select('language').eq('id', deckId).eq('user_id', userId).single()
  if (!deck) throw new DeckAudioError('Deck not found', 404)
  if (!supportsTtsLanguage(deck.language)) throw new DeckAudioError(`TTS is not supported for ${deck.language} decks`, 400)

  const resolvedTts = await resolveValidatedElevenLabsTts(userId, deck.language).catch(() => null)
  if (!resolvedTts) throw new DeckAudioError('Connect ElevenLabs and choose a voice for this language', 500)

  let notesQuery = supabase.from('notes').select('id, fields').eq('deck_id', deckId).eq('user_id', userId)
  if (options.noteIds?.length) notesQuery = notesQuery.in('id', options.noteIds)
  const { data: notes, error: notesError } = await notesQuery
  if (notesError || !notes) throw new DeckAudioError('Failed to fetch notes', 500)

  const cached = options.force ? {} : await getAudioMapForNotes(supabase, notes.map((note) => note.id))
  const pending = notes.filter((note) => !cached[note.id])
  const batch = options.limit ? pending.slice(0, options.limit) : pending
  const delayMs = options.delayMs ?? 500

  const results: BatchAudioResult[] = []
  for (const note of batch) {
    const expression = getNotePrimaryText(note.fields as Record<string, unknown>) || null
    if (!expression) { results.push({ noteId: note.id, status: 'skip' }); continue }

    const result = await generateAndCacheAudio(supabase, userId, note.id, expression, deck.language, resolvedTts)
    results.push({
      noteId: note.id,
      status: 'error' in result ? 'error' : 'ok',
      audioUrl: 'audioUrl' in result ? result.audioUrl : undefined,
      error: 'error' in result ? result.error : undefined,
    })
    // Rate limit between ElevenLabs requests.
    if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs))
  }

  return { results, alreadyVoiced: notes.length - pending.length, remaining: pending.length - batch.length }
}
