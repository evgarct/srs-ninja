export interface CompletionTableErrorLike {
  code?: string
  message?: string
}

export const HOME_COMPLETION_SESSION_TYPES = ['due', 'extra'] as const
export type HomeCompletionSessionType = (typeof HOME_COMPLETION_SESSION_TYPES)[number]

export function isMissingCompletionTableError(error: CompletionTableErrorLike | null) {
  if (!error) return false

  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    error.message?.includes('review_session_completions') === true
  )
}

export function getCompletedTodayDeckIds(
  rows: Array<{ deck_id: string; session_type?: string | null }> | null,
  error: CompletionTableErrorLike | null
) {
  if (isMissingCompletionTableError(error)) {
    return new Set<string>()
  }

  return new Set(
    (rows ?? [])
      .filter((row) =>
        row.session_type
          ? HOME_COMPLETION_SESSION_TYPES.includes(row.session_type as HomeCompletionSessionType)
          : true
      )
      .map((row) => row.deck_id)
  )
}
