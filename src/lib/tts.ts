import type { SupabaseClient } from '@supabase/supabase-js'

export const ELEVENLABS_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'
const ELEVENLABS_MODEL = 'eleven_flash_v2_5'

/**
 * Calls ElevenLabs TTS, uploads the resulting mp3 to Supabase Storage,
 * upserts the URL into audio_cache, and returns the public URL.
 *
 * English only — caller is responsible for the language guard.
 */
export async function generateAndCacheAudio(
  supabase: SupabaseClient,
  userId: string,
  noteId: string,
  text: string,
  language: string
): Promise<{ audioUrl: string } | { error: string }> {
  // Call ElevenLabs
  const ttsResponse = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: ELEVENLABS_MODEL,
        language_code: 'en',
      }),
    }
  )

  if (!ttsResponse.ok) {
    const err = await ttsResponse.text()
    console.error('ElevenLabs error:', err)
    return { error: 'TTS generation failed' }
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
    return { error: 'Upload failed' }
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
      voice_id: ELEVENLABS_VOICE_ID,
      storage_path: versionedAudioUrl,
    },
    { onConflict: 'note_id,field_key' }
  )

  if (cacheError) {
    console.error('audio_cache upsert error:', cacheError)
    // Non-fatal — the file was uploaded, URL is valid
  }

  return { audioUrl: versionedAudioUrl }
}
