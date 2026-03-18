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
  if (language !== 'english') return false
  if (status !== 'approved') return false
  return forceAudio || expressionChanged
}
