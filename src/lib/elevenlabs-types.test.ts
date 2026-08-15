import { describe, expect, it } from 'vitest'

import { getUnavailableVoiceIds, groupVoicesForLanguage } from './elevenlabs-types'

const voices = [
  { voice_id: 'voice-en', name: 'English', labels: {}, available_for_tiers: ['free'], verified_languages: [{ language: 'en' }] },
  { voice_id: 'voice-cs', name: 'Czech', labels: {}, available_for_tiers: ['starter'], verified_languages: [{ language: 'cs' }] },
  { voice_id: 'voice-tr', name: 'Turkish', labels: {}, available_for_tiers: [], verified_languages: [{ language: 'tr' }] },
]

describe('ElevenLabs voice selections', () => {
  it('accepts a different available voice for every language', () => {
    expect(getUnavailableVoiceIds({
      english: 'voice-en', czech: 'voice-cs', turkish: 'voice-tr',
    }, voices)).toEqual([])
  })

  it('rejects IDs that are not available in the connected account', () => {
    expect(getUnavailableVoiceIds({ english: 'another-account-voice' }, voices))
      .toEqual(['another-account-voice'])
  })

  it('allows a language to remain unconfigured', () => {
    expect(getUnavailableVoiceIds({ english: null, czech: '', turkish: 'voice-tr' }, voices))
      .toEqual([])
  })

  it('puts only language-verified voices in the first group without filtering account voices by tier metadata', () => {
    expect(groupVoicesForLanguage(voices, 'turkish')).toEqual({
      verified: [voices[2]],
      other: [voices[0], voices[1]],
    })
  })
})
