export function playAudioUrl(audioUrl?: string) {
  if (!audioUrl) return Promise.resolve()
  return new Audio(audioUrl).play().catch(() => {})
}
