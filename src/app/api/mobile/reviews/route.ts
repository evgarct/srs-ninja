import { mobileUnauthorized, resolveMobileContext } from '@/lib/mobile-api'
import { parseReviewRating, submitReviewForUser } from '@/lib/review-service'

export const dynamic = 'force-dynamic'

/** Grades one card from an Android session: same FSRS update and review log as the web review. */
export async function POST(request: Request) {
  const context = await resolveMobileContext(request)
  if (!context) return mobileUnauthorized()

  const body = (await request.json().catch(() => null)) as
    | { cardId?: unknown; rating?: unknown; durationMs?: unknown }
    | null
  const cardId = typeof body?.cardId === 'string' ? body.cardId : ''
  const rating =
    typeof body?.rating === 'string' || typeof body?.rating === 'number' ? parseReviewRating(body.rating) : null
  const durationMs = Math.max(0, Math.min(10 * 60_000, Math.round(Number(body?.durationMs) || 0)))
  if (!cardId || rating === null) return Response.json({ error: 'INVALID_REVIEW' }, { status: 400 })

  const { scheduledDays, updatedCard } = await submitReviewForUser(
    context.supabase,
    context.userId,
    cardId,
    rating,
    durationMs
  )
  return Response.json({ scheduledDays, dueAt: updatedCard.due_at, state: updatedCard.state })
}
