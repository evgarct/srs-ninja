export interface CompletionTableErrorLike {
  code?: string
  message?: string
}

export function isMissingCompletionTableError(error: CompletionTableErrorLike | null) {
  if (!error) return false

  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    error.message?.includes('review_session_completions') === true
  )
}

export function getCompletedTodayDeckIds(
  rows: Array<{ deck_id: string }> | null,
  error: CompletionTableErrorLike | null
) {
  if (isMissingCompletionTableError(error)) {
    return new Set<string>()
  }

  return new Set((rows ?? []).map((row) => row.deck_id))
}
