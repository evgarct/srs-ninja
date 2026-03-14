'use server'

import { createClient } from '@/lib/supabase/server'

export async function getReviewStats(days = 30) {
  const supabase = await createClient()
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await supabase
    .from('reviews')
    .select('reviewed_at, rating, state_before, state_after')
    .gte('reviewed_at', since.toISOString())
    .order('reviewed_at', { ascending: true })
  if (error) throw error
  return data
}

export async function getTodayStats() {
  const supabase = await createClient()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('reviews')
    .select('rating, state_before, review_duration_ms')
    .gte('reviewed_at', todayStart.toISOString())
  if (error) throw error

  const total = data.length
  const correct = data.filter((r) => r.rating >= 2).length
  const avgDuration = total > 0
    ? data.reduce((sum, r) => sum + (r.review_duration_ms ?? 0), 0) / total
    : 0

  return { total, correct, accuracy: total > 0 ? Math.round((correct / total) * 100) : 0, avgDuration }
}

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
