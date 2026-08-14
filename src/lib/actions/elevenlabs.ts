'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { encryptSecret, decryptSecret } from '@/lib/server/secret-encryption'
import { fetchElevenLabsAccount } from '@/lib/server/elevenlabs-account'
import { ELEVENLABS_LANGUAGES, type ElevenLabsVoiceSelections } from '@/lib/elevenlabs-types'

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user
}

export async function getElevenLabsSettings() {
  const user = await requireUser()
  const isOwner = user.id === process.env.ELEVENLABS_OWNER_USER_ID?.trim()
  if (isOwner) return { isOwner: true, connected: true, tier: 'owner', voices: [], selections: {} }
  const admin = createAdminClient()
  const { data } = await admin.from('user_elevenlabs_settings').select('*').eq('user_id', user.id).maybeSingle()
  if (!data) return { isOwner: false, connected: false, tier: null, voices: [], selections: {} }
  let account
  try {
    account = await fetchElevenLabsAccount(decryptSecret(data.encrypted_api_key))
  } catch {
    return {
      isOwner: false,
      connected: true,
      connectionError: true,
      tier: data.account_tier,
      voices: [],
      selections: { english: data.english_voice_id, czech: data.czech_voice_id, turkish: data.turkish_voice_id },
    }
  }
  return {
    isOwner: false,
    connected: true,
    connectionError: false,
    tier: data.account_tier,
    voices: account.voices,
    selections: { english: data.english_voice_id, czech: data.czech_voice_id, turkish: data.turkish_voice_id },
  }
}

export async function connectElevenLabs(apiKey: string) {
  const user = await requireUser()
  if (user.id === process.env.ELEVENLABS_OWNER_USER_ID?.trim()) throw new Error('Owner account already uses the system connection')
  const normalized = apiKey.trim()
  if (normalized.length < 20 || normalized.length > 256) throw new Error('Invalid ElevenLabs API key')
  const account = await fetchElevenLabsAccount(normalized)
  const admin = createAdminClient()
  const { error } = await admin.from('user_elevenlabs_settings').upsert({
    user_id: user.id,
    encrypted_api_key: encryptSecret(normalized),
    account_tier: account.tier,
  }, { onConflict: 'user_id' })
  if (error) throw new Error('Could not save ElevenLabs connection')
  return { tier: account.tier, voices: account.voices }
}

export async function saveElevenLabsVoices(selections: ElevenLabsVoiceSelections) {
  const user = await requireUser()
  if (!selections || typeof selections !== 'object' || Array.isArray(selections)) throw new Error('Invalid voice settings')
  const suppliedKeys = Object.keys(selections)
  if (suppliedKeys.some((key) => !ELEVENLABS_LANGUAGES.includes(key as never))) throw new Error('Invalid voice settings')
  if (Object.values(selections).some((value) => value !== null && value !== undefined && (typeof value !== 'string' || value.length > 128))) throw new Error('Invalid voice settings')
  const admin = createAdminClient()
  const { data } = await admin.from('user_elevenlabs_settings').select('encrypted_api_key').eq('user_id', user.id).maybeSingle()
  if (!data) throw new Error('Connect ElevenLabs first')
  const account = await fetchElevenLabsAccount(decryptSecret(data.encrypted_api_key))
  const allowed = new Set(account.voices.map((voice) => voice.voice_id))
  for (const value of Object.values(selections)) if (value && !allowed.has(value)) throw new Error('Selected voice is not available in this ElevenLabs account')
  const { error } = await admin.from('user_elevenlabs_settings').update({
    english_voice_id: selections.english ?? null,
    czech_voice_id: selections.czech ?? null,
    turkish_voice_id: selections.turkish ?? null,
  }).eq('user_id', user.id)
  if (error) throw new Error('Could not save voice settings')
}

export async function disconnectElevenLabs() {
  const user = await requireUser()
  if (user.id === process.env.ELEVENLABS_OWNER_USER_ID?.trim()) throw new Error('Owner connection cannot be removed here')
  const admin = createAdminClient()
  const { error } = await admin.from('user_elevenlabs_settings').delete().eq('user_id', user.id)
  if (error) throw new Error('Could not disconnect ElevenLabs')
}
