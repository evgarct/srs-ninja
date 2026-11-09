import { orderCards } from '@/lib/card-ordering'
import { mapCardForMobile, mobileUnauthorized, resolveMobileContext } from '@/lib/mobile-api'
import { selectReviewSessionCards } from '@/lib/review-card-selection'
import { REGULAR_DUE_REVIEW_LIMIT } from '@/lib/review-config'
import {
  getDueCardsForUser,
  getExtraStudyCardsByKind,
  getExtraStudyCardsForUser,
  parseExtraStudyKind,
} from '@/lib/review-service'
import type { Language } from '@/lib/types'

export const dynamic = 'force-dynamic'

/**
 * Android review session for one deck. `mode=due` (default) is today's review ordered exactly
 * like the web session; `mode=extra&limit=N` is extra study: with `kind=hard|new|random|forgotten`
 * it picks that pool, without `kind` it matches the web (new cards first, then upcoming).
 */
export async function GET(request: Request, { params }: { params: Promise<{ deckId: string }> }) {
  const context = await resolveMobileContext(request)
  if (!context) return mobileUnauthorized()

  const { deckId } = await params
  const search = new URL(request.url).searchParams
  const mode = search.get('mode') === 'extra' ? 'extra' : 'due'
  const limit = Math.min(200, Math.max(1, Number(search.get('limit')) || 20))

  const { data: deck, error: deckError } = await context.supabase
    .from('decks')
    .select('id, name, language, translation_language')
    .eq('id', deckId)
    .maybeSingle()
  if (deckError) throw deckError
  if (!deck) return Response.json({ error: 'DECK_NOT_FOUND' }, { status: 404 })

  const isExtra = mode === 'extra'
  const kind = parseExtraStudyKind(search.get('kind'))
  const rawCards = !isExtra
    ? await getDueCardsForUser(context.supabase, deckId, REGULAR_DUE_REVIEW_LIMIT)
    : kind
      ? await getExtraStudyCardsByKind(context.supabase, deckId, kind, limit)
      : await getExtraStudyCardsForUser(context.supabase, deckId, limit)

  const cards = selectReviewSessionCards(rawCards, {
    isExtra,
    orderCards,
    sessionLimit: isExtra ? undefined : REGULAR_DUE_REVIEW_LIMIT,
  })

  return Response.json({
    deck: {
      id: deck.id,
      name: deck.name,
      language: deck.language,
      translationLanguage: deck.translation_language,
    },
    mode,
    cards: cards.map((card) => mapCardForMobile(card, deck.language as Language)),
  })
}
