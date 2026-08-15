import { describe, expect, it } from 'vitest'

import { getUnavailableVoiceIds } from './elevenlabs-types'

const voices = [
  { voice_id: 'voice-en', name: 'English' },
  { voice_id: 'voice-cs', name: 'Czech' },
  { voice_id: 'voice-tr', name: 'Turkish' },
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
})
