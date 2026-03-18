export type BatchAudioResult = {
  noteId: string
  status: 'ok' | 'skip' | 'error'
  audioUrl?: string
  error?: string
}

export function summarizeBatchAudioResults(results: BatchAudioResult[]) {
  const response = {
    total: results.length,
    generated: results.filter((r) => r.status === 'ok').length,
    skipped: results.filter((r) => r.status === 'skip').length,
    errors: results.filter((r) => r.status === 'error').length,
    errorMessages: results
      .filter((r) => r.status === 'error' && r.error)
      .map((r) => r.error as string),
    generatedAudio: results
      .filter((r) => r.status === 'ok' && r.audioUrl)
      .map((r) => ({ noteId: r.noteId, audioUrl: r.audioUrl as string })),
  }

  const status =
    response.generated === 0 && response.errors > 0
      ? 500
      : 200

  return {
    status,
    body:
      status === 500
        ? {
            ...response,
            error: response.errorMessages[0] ?? 'Audio generation failed',
          }
        : response,
  }
}
