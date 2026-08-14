import { connectElevenLabs, disconnectElevenLabs, saveElevenLabsVoices } from '@/lib/actions/elevenlabs'
import { ElevenLabsSettingsView, type ElevenLabsSettingsState } from '@/components/elevenlabs-settings-view'

export function ElevenLabsSettings({ initial }: { initial: ElevenLabsSettingsState }) {
  return <ElevenLabsSettingsView initial={initial} actions={{
    connect: connectElevenLabs,
    saveVoices: saveElevenLabsVoices,
    disconnect: disconnectElevenLabs,
  }} />
}
