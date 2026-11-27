'use server'

import { createClient } from '@/lib/supabase/server'
import {
  getCardStateDistributionForUser,
  getReviewHistoryForUser,
  getTodayStatsForUser,
  getWeeklyActivityStatsForUser,
} from '@/lib/study-stats-service'

export type { WeeklyActivityStats } from '@/lib/study-stats-service'

// Thin cookie-session wrappers; the logic lives in study-stats-service and is shared with MCP.

/** Reviews over the last `days` days (time, rating, card state). */
export async function getReviewStats(days = 30) {
  return getReviewHistoryForUser(await createClient(), days)
}

/** Today's review count, correct answers, accuracy % and average duration in ms. */
export async function getTodayStats() {
  return getTodayStatsForUser(await createClient())
}

/** Card counts per FSRS state (new, learning, review, relearning). */
export async function getCardStateDistribution() {
  return getCardStateDistributionForUser(await createClient())
}

/** Review activity for the current Monday-first week and the streak ending today. */
export async function getWeeklyActivityStats(timeZone: string) {
  return getWeeklyActivityStatsForUser(await createClient(), timeZone)
}
