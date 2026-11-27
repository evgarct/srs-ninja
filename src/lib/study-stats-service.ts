import type { SupabaseClient } from '@supabase/supabase-js'
import {
  getCurrentWeekDateKeys,
  getWeeklyQueryStartUtc,
  toDateKeyInTimeZone,
  type ActivityDaySummary,
} from '@/lib/activity'

// Study statistics shared by the /stats page (src/lib/actions/stats.ts) and the MCP
// get_study_stats tool. Every query runs under the caller's RLS client.

export interface WeeklyActivityStats {
  days: ActivityDaySummary[]
  streak: number
  activeDays: number
  weekStartKey: string
  todayKey: string
}

/** Reviews over the last `days` days (time, rating, card state). */
export async function getReviewHistoryForUser(supabase: SupabaseClient, days = 30) {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await supabase
    .from('reviews')
    .select('reviewed_at, rating, state')
    .gte('reviewed_at', since.toISOString())
    .order('reviewed_at', { ascending: true })
  if (error) throw error
  return data as Array<{ reviewed_at: string; rating: number; state: string }>
}

/** Today's reviews, correct answers (rating >= 2), accuracy % and average duration in ms. */
export async function getTodayStatsForUser(supabase: SupabaseClient) {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('reviews')
    .select('rating, review_duration_ms')
    .gte('reviewed_at', todayStart.toISOString())
  if (error) throw error

  const rows = data as Array<{ rating: number; review_duration_ms: number | null }>
  const total = rows.length
  const correct = rows.filter((r) => r.rating >= 2).length
  const avgDuration = total > 0
    ? rows.reduce((sum, r) => sum + (r.review_duration_ms ?? 0), 0) / total
    : 0

  return { total, correct, accuracy: total > 0 ? Math.round((correct / total) * 100) : 0, avgDuration }
}

/** Card counts per FSRS state across the whole collection. */
export async function getCardStateDistributionForUser(supabase: SupabaseClient) {
  const { data, error } = await supabase.from('cards').select('state')
  if (error) throw error

  const counts = { new: 0, learning: 0, review: 0, relearning: 0 }
  for (const card of data as Array<{ state: string }>) {
    counts[card.state as keyof typeof counts] = (counts[card.state as keyof typeof counts] ?? 0) + 1
  }
  return counts
}

/** Review activity for the current Monday-first week and the streak ending today. */
export async function getWeeklyActivityStatsForUser(supabase: SupabaseClient, timeZone: string): Promise<WeeklyActivityStats> {
  const now = new Date()
  const { todayKey, weekStartKey, weekDateKeys } = getCurrentWeekDateKeys(timeZone, now)
  const since = getWeeklyQueryStartUtc(weekStartKey)
  const weekDateKeySet = new Set(weekDateKeys)

  const { data, error } = await supabase
    .from('reviews')
    .select('reviewed_at, card_id, rating, state')
    .gte('reviewed_at', since.toISOString())
    .order('reviewed_at', { ascending: true })
  if (error) throw error

  const reviewCountByDay = new Map<string, number>()
  const masteredCardIdsByDay = new Map<string, Set<string>>()

  for (const review of data as Array<{ reviewed_at: string; card_id: string; rating: number; state: string }>) {
    const key = toDateKeyInTimeZone(new Date(review.reviewed_at), timeZone)
    if (!weekDateKeySet.has(key)) continue

    reviewCountByDay.set(key, (reviewCountByDay.get(key) ?? 0) + 1)

    if (review.rating >= 3 && review.state === 'review') {
      const ids = masteredCardIdsByDay.get(key) ?? new Set<string>()
      ids.add(review.card_id)
      masteredCardIdsByDay.set(key, ids)
    }
  }

  const days: ActivityDaySummary[] = weekDateKeys.map((key) => ({
    date: key,
    reviews: reviewCountByDay.get(key) ?? 0,
    masteredWords: masteredCardIdsByDay.get(key)?.size ?? 0,
    isToday: key === todayKey,
    isFuture: key > todayKey,
  }))

  let streak = 0
  for (let index = days.findIndex((day) => day.isToday); index >= 0; index--) {
    if (days[index].reviews < 1) break
    streak++
  }

  return {
    days,
    streak,
    activeDays: days.filter((day) => day.reviews > 0).length,
    weekStartKey,
    todayKey,
  }
}
