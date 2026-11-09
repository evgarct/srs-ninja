import { mobileUnauthorized, resolveMobileContext } from '@/lib/mobile-api'
import { isMissingCompletionTableError } from '@/lib/review-session-completions'

export const dynamic = 'force-dynamic'

/** Records a finished Android session, so the deck shows "done for today" on every device. */
export async function POST(request: Request, { params }: { params: Promise<{ deckId: string }> }) {
  const context = await resolveMobileContext(request)
  if (!context) return mobileUnauthorized()

  const { deckId } = await params
  const body = (await request.json().catch(() => null)) as { sessionType?: unknown } | null
  const sessionType = body?.sessionType === 'extra' ? 'extra' : 'due'

  const { error } = await context.supabase
    .from('review_session_completions')
    .insert({ deck_id: deckId, user_id: context.userId, session_type: sessionType })
  if (error && !isMissingCompletionTableError(error)) throw error

  return Response.json({ ok: true })
}
