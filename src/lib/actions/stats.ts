'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Retrieves the user's historical review data over a specified lookback period.
 * 
 * @param days - The number of days in the past to fetch reviews from (default: 30).
 * @returns A promise resolving to an array of review data (time, user rating, card state).
 */
export async function getReviewStats(days = 30) {
  const supabase = await createClient()
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await supabase
    .from('reviews')
    .select('reviewed_at, rating, state')
    .gte('reviewed_at', since.toISOString())
    .order('reviewed_at', { ascending: true })
  if (error) throw error
  return data
}

/**
 * Calculates real-time analytics for the current day's review activity.
 * 
 * This aggregates the number of reviews done today, calculates accuracy 
 * (ratings of 'Hard', 'Good', or 'Easy' vs 'Again'), and determines the 
 * average time spent reviewing each card.
 * 
 * @returns An object containing `total` reviews, `correct` reviews, overall `accuracy` percentage, and `avgDuration` in milliseconds.
 */
export async function getTodayStats() {
  const supabase = await createClient()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('reviews')
    .select('rating, review_duration_ms')
    .gte('reviewed_at', todayStart.toISOString())
  if (error) throw error

  const total = data.length
  const correct = data.filter((r) => r.rating >= 2).length
  const avgDuration = total > 0
    ? data.reduce((sum, r) => sum + (r.review_duration_ms ?? 0), 0) / total
    : 0

  return { total, correct, accuracy: total > 0 ? Math.round((correct / total) * 100) : 0, avgDuration }
}

/**
 * Retrieves the overall distribution of card states across the user's entire collection.
 * 
 * A card state defines where it is in the FSRS lifecycle:
 * - `new`: Never reviewed.
 * - `learning`: In the initial learning phase.
 * - `review`: An accumulated mature card.
 * - `relearning`: A card the user previously knew but forgot.
 * 
 * @returns An object with counts for each state category.
 */
export async function getCardStateDistribution() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('cards').select('state')
  if (error) throw error

  const counts = { new: 0, learning: 0, review: 0, relearning: 0 }
  for (const card of data) {
    counts[card.state as keyof typeof counts] = (counts[card.state as keyof typeof counts] ?? 0) + 1
  }
  return counts
}
