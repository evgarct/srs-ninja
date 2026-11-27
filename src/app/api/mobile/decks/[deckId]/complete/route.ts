import { mobileUnauthorized, resolveMobileContext } from '@/lib/mobile-api'
import { markReviewSessionCompletedForUser } from '@/lib/deck-service'

export const dynamic = 'force-dynamic'

/** Records a finished Android session, so the deck shows "done for today" on every device. */
export async function POST(request: Request, { params }: { params: Promise<{ deckId: string }> }) {
  const context = await resolveMobileContext(request)
  if (!context) return mobileUnauthorized()

  const { deckId } = await params
  const body = (await request.json().catch(() => null)) as { sessionType?: unknown } | null
  const sessionType = body?.sessionType === 'extra' ? 'extra' : 'due'

  await markReviewSessionCompletedForUser(context.supabase, context.userId, deckId, sessionType)

  return Response.json({ ok: true })
}
