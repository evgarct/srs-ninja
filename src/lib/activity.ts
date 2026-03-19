export interface ActivityRecord {
  reviewed_at: string
  rating: number
  state: string
  card_id?: string
}

export interface ActivityDaySummary {
  date: string
  reviews: number
  masteredWords: number
  isToday: boolean
  isFuture: boolean
}

export interface HeatmapWeek {
  startDate: string
  days: ActivityDaySummary[]
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

export function toDateKeyInTimeZone(date: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(date)
  const year = parts.find((part) => part.type === 'year')?.value ?? '0000'
  const month = parts.find((part) => part.type === 'month')?.value ?? '01'
  const day = parts.find((part) => part.type === 'day')?.value ?? '01'
  return `${year}-${month}-${day}`
}

export function shiftDateKey(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

export function getMondayIndex(dateKey: string): number {
  const date = new Date(`${dateKey}T00:00:00Z`)
  return (date.getUTCDay() + 6) % 7
}

export function getCurrentWeekDateKeys(
  timeZone: string,
  now: Date = new Date()
): { todayKey: string; weekStartKey: string; weekDateKeys: string[] } {
  const todayKey = toDateKeyInTimeZone(now, timeZone)
  const weekStartKey = shiftDateKey(todayKey, -getMondayIndex(todayKey))
  return {
    todayKey,
    weekStartKey,
    weekDateKeys: Array.from({ length: 7 }, (_, index) => shiftDateKey(weekStartKey, index)),
  }
}

function summarizeActivityByDay(records: ActivityRecord[], timeZone: string) {
  const reviewCountByDay = new Map<string, number>()
  const masteredCardIdsByDay = new Map<string, Set<string>>()

  for (const review of records) {
    const key = toDateKeyInTimeZone(new Date(review.reviewed_at), timeZone)
    reviewCountByDay.set(key, (reviewCountByDay.get(key) ?? 0) + 1)

    if (review.card_id && review.rating >= 3 && review.state === 'review') {
      const ids = masteredCardIdsByDay.get(key) ?? new Set<string>()
      ids.add(review.card_id)
      masteredCardIdsByDay.set(key, ids)
    }
  }

  return { reviewCountByDay, masteredCardIdsByDay }
}

export function getActivityIntensity(reviews: number): 0 | 1 | 2 | 3 | 4 {
  if (reviews <= 0) return 0
  if (reviews < 5) return 1
  if (reviews < 15) return 2
  if (reviews < 30) return 3
  return 4
}

export function buildReviewHeatmapWeeks(
  records: ActivityRecord[],
  timeZone: string,
  {
    weeks = 12,
    now = new Date(),
  }: {
    weeks?: number
    now?: Date
  } = {}
) {
  const { reviewCountByDay, masteredCardIdsByDay } = summarizeActivityByDay(records, timeZone)
  const { todayKey, weekStartKey } = getCurrentWeekDateKeys(timeZone, now)
  const firstWeekStartKey = shiftDateKey(weekStartKey, -(weeks - 1) * 7)

  const weekEntries: HeatmapWeek[] = Array.from({ length: weeks }, (_, weekIndex) => {
    const startDate = shiftDateKey(firstWeekStartKey, weekIndex * 7)
    return {
      startDate,
      days: Array.from({ length: 7 }, (_, dayIndex) => {
        const dateKey = shiftDateKey(startDate, dayIndex)
        return {
          date: dateKey,
          reviews: reviewCountByDay.get(dateKey) ?? 0,
          masteredWords: masteredCardIdsByDay.get(dateKey)?.size ?? 0,
          isToday: dateKey === todayKey,
          isFuture: dateKey > todayKey,
        }
      }),
    }
  })

  return {
    weeks: weekEntries,
    todayKey,
    firstWeekStartKey,
  }
}
