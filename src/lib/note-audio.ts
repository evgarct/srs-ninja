import { supportsTtsLanguage } from '@/lib/tts-config'

export function shouldGenerateAudioForNote({
  language,
  status,
  forceAudio,
  expressionChanged,
}: {
  language: string
  status: string | null | undefined
  forceAudio: boolean
  expressionChanged: boolean
}) {
  if (!supportsTtsLanguage(language)) return false
  if (status !== 'approved') return false
  return forceAudio || expressionChanged
}
