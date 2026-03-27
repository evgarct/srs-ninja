import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateAndCacheAudio } from '@/lib/tts'
import { supportsTtsLanguage } from '@/lib/tts-config'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { noteId, text, language } = body as {
    noteId?: string
    text?: string
    language?: string
  }

  if (!noteId || !text) {
    return NextResponse.json({ error: 'Missing noteId or text' }, { status: 400 })
  }

  const normalizedLanguage = language ?? 'english'
  if (!supportsTtsLanguage(normalizedLanguage)) {
    return NextResponse.json(
      { error: `TTS is not supported for ${normalizedLanguage} decks` },
      { status: 400 }
    )
  }

  const result = await generateAndCacheAudio(supabase, user.id, noteId, text, normalizedLanguage)

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ audioUrl: result.audioUrl })
}
