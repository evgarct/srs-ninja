import { getDashboardStatsForUser } from '@/lib/dashboard-stats'
import { mobileUnauthorized, parseTimeZone, resolveMobileContext } from '@/lib/mobile-api'

export const dynamic = 'force-dynamic'

/** Android home: the user's decks with today's due count, as on the web home. `?tz=` is the phone's IANA zone. */
export async function GET(request: Request) {
  const context = await resolveMobileContext(request)
  if (!context) return mobileUnauthorized()

  const timeZone = parseTimeZone(new URL(request.url).searchParams.get('tz'))
  const stats = await getDashboardStatsForUser(context.supabase, context.userId, timeZone)

  return Response.json({
    decks: stats.map(({ deck, due, total, drafts, completedToday }) => ({
      id: deck.id,
      name: deck.name,
      language: deck.language,
      translationLanguage: deck.translation_language,
      due,
      total,
      drafts,
      completedToday,
    })),
  })
}
