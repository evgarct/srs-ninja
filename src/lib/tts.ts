import type { SupabaseClient } from '@supabase/supabase-js'
import { getTtsLanguageConfig } from '@/lib/tts-config'

/**
 * Calls ElevenLabs TTS, uploads the resulting mp3 to Supabase Storage,
 * upserts the URL into audio_cache, and returns the public URL.
 */
export async function generateAndCacheAudio(
  supabase: SupabaseClient,
  userId: string,
  noteId: string,
  text: string,
  language: string
): Promise<{ audioUrl: string } | { error: string }> {
  if (!process.env.ELEVENLABS_API_KEY) {
    return { error: 'ELEVENLABS_API_KEY is not configured' }
  }

  const config = getTtsLanguageConfig(language)
  if (!config) {
    return { error: `TTS is not supported for ${language} decks` }
  }

  // Call ElevenLabs
  const ttsResponse = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${config.voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: config.modelId,
        language_code: config.languageCode,
      }),
    }
  )

  if (!ttsResponse.ok) {
    const err = await ttsResponse.text()
    console.error('ElevenLabs error:', err)
    return { error: `TTS generation failed: ${err || ttsResponse.statusText}` }
  }

  const audioBuffer = await ttsResponse.arrayBuffer()
  
  // Ensure path variables are clean
  const cleanUserId = userId.trim().replace(/^\/+/, '')
  const cleanNoteId = noteId.trim()

  // Upload to Supabase Storage — path: {userId}/{noteId}.mp3
  const storagePath = `${cleanUserId}/${cleanNoteId}.mp3`
  
  console.log('--- TTS DEBUG ---')
  console.log('Status 200 from API:', ttsResponse.status === 200)
  console.log('Audio buffer size (bytes):', audioBuffer.byteLength)
  console.log('Storage path to upload:', storagePath)

  const { error: uploadError } = await supabase.storage
    .from('audio')
    .upload(storagePath, audioBuffer, {
      contentType: 'audio/mpeg',
      upsert: true,
    })

  if (uploadError) {
    console.error('Storage upload error (FULL):', JSON.stringify(uploadError, null, 2))
    console.error('Storage upload error stringified:', String(uploadError))
    return { error: `Audio upload failed: ${uploadError.message}` }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('audio').getPublicUrl(storagePath)

  // Cache-bust regenerated files so the UI immediately plays the fresh mp3.
  const versionedAudioUrl = `${publicUrl}?v=${Date.now()}`

  // Save to audio_cache
  const { error: cacheError } = await supabase.from('audio_cache').upsert(
    {
      note_id: noteId,
      field_key: 'expression',
      language,
      voice_id: config.voiceId,
      storage_path: versionedAudioUrl,
    },
    { onConflict: 'note_id,field_key' }
  )

  if (cacheError) {
    console.error('audio_cache upsert error:', cacheError)
    return { error: `Failed to update audio cache: ${cacheError.message}` }
  }

  return { audioUrl: versionedAudioUrl }
}
