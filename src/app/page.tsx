import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getDashboardStats } from '@/lib/actions/decks'
import { CreateDeckDialog } from '@/components/create-deck-dialog'
import { headers } from 'next/headers'
import { HomeDeckCard } from '@/components/home-deck-card'

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
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-5 sm:py-8">
      <div className="mb-6 flex items-start justify-between gap-4 sm:mb-8 sm:items-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">SRS Ninja</h1>
        <CreateDeckDialog />
      </div>

      {deckStats.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/80 px-6 py-16 text-center text-muted-foreground">
          <p className="text-lg mb-2">Нет колод</p>
          <p className="text-sm">Создайте первую колоду, чтобы начать</p>
        </div>
      ) : (
        <section className="space-y-3 sm:space-y-4">
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
  )
}
