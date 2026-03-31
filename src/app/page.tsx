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
      <main className="mx-auto flex h-[calc(100svh-4.5rem)] max-w-3xl flex-col gap-3 overflow-hidden px-4 pb-4 pt-4 sm:gap-4 sm:px-5 sm:pb-5 sm:pt-6">
        <section className="flex shrink-0 items-end justify-between gap-4 px-1 pt-1">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/40">Home</p>
            <h1 className="text-2xl font-semibold tracking-[-0.05em] text-white">Что учить дальше</h1>
          </div>
          <p className="text-sm text-white/44">{deckStats.length} decks</p>
        </section>

        {deckStats.length === 0 ? (
          <div className="flex flex-1 items-center">
            <div className="app-panel w-full px-6 py-16 text-center text-white/72">
              <p className="mb-2 text-lg text-white">Нет колод</p>
              <p className="text-sm">Создайте первую колоду, чтобы начать.</p>
            </div>
          </div>
        ) : (
          <section className="flex min-h-0 flex-1 flex-col">
            <div className="grid min-h-0 auto-rows-fr gap-3 sm:grid-cols-2">
              {deckStats.map(({ deck, due, drafts, completedToday }) => (
                <HomeDeckCard
                  key={deck.id}
                  deck={deck}
                  due={due}
                  drafts={drafts}
                  completedToday={completedToday}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
