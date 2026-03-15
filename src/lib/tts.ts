import type { SupabaseClient } from '@supabase/supabase-js'

export const ELEVENLABS_VOICE_ID = 'wWWn96OtTHu1sn8SRGEr'
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

  // Upload to Supabase Storage — path: {userId}/{noteId}.mp3
  const storagePath = `${userId}/${noteId}.mp3`
  const { error: uploadError } = await supabase.storage
    .from('audio')
    .upload(storagePath, audioBuffer, {
      contentType: 'audio/mpeg',
      upsert: true,
    })

  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    return { error: 'Upload failed' }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('audio').getPublicUrl(storagePath)

  // Save to audio_cache
  const { error: cacheError } = await supabase.from('audio_cache').upsert(
    {
      note_id: noteId,
      field_key: 'expression',
      language,
      voice_id: ELEVENLABS_VOICE_ID,
      storage_path: publicUrl,
    },
    { onConflict: 'note_id,field_key' }
  )

  if (cacheError) {
    console.error('audio_cache upsert error:', cacheError)
    // Non-fatal — the file was uploaded, URL is valid
  }

  return { audioUrl: publicUrl }
}
