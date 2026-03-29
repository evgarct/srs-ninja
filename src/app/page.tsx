import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getDashboardStats } from '@/lib/actions/decks'
import { headers } from 'next/headers'
import { HomeDeckCard } from '@/components/home-deck-card'
import { HomeViewportLock } from '@/components/home-viewport-lock'

/**
 * The main application dashboard.
 * 
 * This server component requires authentication. It fetches and displays:
 * 1. An aggregated summary of the user's review activity for today.
 * 2. A grid of all the user's decks, indicating how many total cards there are
 *    and how many are currently due for review.
 * 
 * @returns The rendered dashboard page.
 */
export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const requestHeaders = await headers()
  const headerTimeZone = requestHeaders.get('x-vercel-ip-timezone') ?? 'UTC'
  const timeZone = (() => {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: headerTimeZone })
      return headerTimeZone
    } catch {
      return 'UTC'
    }
  })()

  const deckStats = await getDashboardStats(timeZone)

  return (
    <>
      <HomeViewportLock />
      <main className="mx-auto flex h-[calc(100svh-3.5rem)] max-w-3xl flex-col overflow-hidden px-4 py-6 sm:px-5 sm:py-8">
        {deckStats.length === 0 ? (
          <div className="flex flex-1 items-center">
            <div className="w-full rounded-3xl border border-dashed border-border/80 px-6 py-16 text-center text-muted-foreground">
              <p className="mb-2 text-lg">Нет колод</p>
              <p className="text-sm">Создайте первую колоду, чтобы начать</p>
            </div>
          </div>
        ) : (
          <section className="grid gap-3 sm:gap-4 lg:grid-cols-2">
            {deckStats.map(({ deck, due, drafts, completedToday }) => (
              <HomeDeckCard
                key={deck.id}
                deck={deck}
                due={due}
                drafts={drafts}
                completedToday={completedToday}
              />
            ))}
          </section>
        )}
      </main>
    </>
  )
}
