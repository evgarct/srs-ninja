export function getStartOfDayInTimeZone(now: Date, timeZone: string) {
  const zonedNow = new Date(now.toLocaleString('en-US', { timeZone }))
  const zonedStart = new Date(zonedNow)
  zonedStart.setHours(0, 0, 0, 0)

  const offsetMs = zonedNow.getTime() - now.getTime()
  return new Date(zonedStart.getTime() - offsetMs)
}

export function countVisibleDueCardsByDeck(
  dueCards: Array<{ id: string; deckId: string }>,
  reviewedTodayCardIds: Iterable<string>
) {
  const reviewedToday = new Set(reviewedTodayCardIds)
  const counts = new Map<string, number>()

  for (const card of dueCards) {
    if (reviewedToday.has(card.id)) continue
    counts.set(card.deckId, (counts.get(card.deckId) ?? 0) + 1)
  }

  return counts
}
