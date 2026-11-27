import { createAdminClient } from '@/lib/supabase/admin'
import { decryptSecret } from '@/lib/server/secret-encryption'
import { fetchElevenLabsAccount } from '@/lib/server/elevenlabs-account'

/**
 * The user's ElevenLabs connection: tier, available voices and the voice chosen per language.
 * Never returns the API key. Shared by the settings page action and the MCP get_audio_settings tool.
 */
export async function getElevenLabsSettingsForUser(userId: string) {
  const admin = createAdminClient()
  const { data } = await admin.from('user_elevenlabs_settings').select('*').eq('user_id', userId).maybeSingle()
  if (!data) return { connected: false, tier: null, voices: [], selections: {} }
  const selections = { english: data.english_voice_id, czech: data.czech_voice_id, turkish: data.turkish_voice_id }
  let account
  try {
    account = await fetchElevenLabsAccount(decryptSecret(data.encrypted_api_key))
  } catch {
    return { connected: true, connectionError: true, tier: data.account_tier, voices: [], selections }
  }
  return { connected: true, connectionError: false, tier: data.account_tier, voices: account.voices, selections }
}
