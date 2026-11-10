import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { supportsTtsLanguage } from '@/lib/tts-config'

/**
 * noteId → public URL of the note's generated expression audio (ElevenLabs, `audio_cache`).
 * Shared by the web review page and the Android session so both play the same recordings;
 * notes without a recording get no entry and show no speaker button.
 */
export async function getExpressionAudioMap(
  supabase: SupabaseClient<Database>,
  language: string,
  noteIds: string[]
): Promise<Record<string, string>> {
  if (!supportsTtsLanguage(language) || noteIds.length === 0) return {}
  const { data } = await supabase
    .from('audio_cache')
    .select('note_id, storage_path')
    .in('note_id', [...new Set(noteIds)])
    .eq('field_key', 'expression')
  return Object.fromEntries((data ?? []).map((row) => [row.note_id, row.storage_path]))
}
