import { HomeDeckCard } from '@/components/home-deck-card'
import { HomeViewportLock } from '@/components/home-viewport-lock'
import { getDashboardStats } from '@/lib/actions/decks'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
  const t = await getTranslations('home')

  return (
    <>
      <HomeViewportLock />
      <main className="mx-auto flex h-[100svh] max-w-3xl flex-col overflow-hidden px-4 pb-[calc(env(safe-area-inset-bottom)+6.25rem)] pt-[calc(env(safe-area-inset-top)+1rem)] sm:px-5 md:h-[calc(100svh-4.5rem)] md:pb-5 md:pt-6">
        {deckStats.length === 0 ? (
          <div className="flex flex-1 items-center">
            <div className="app-panel w-full px-6 py-16 text-center text-white/72">
              <p className="mb-2 text-lg text-white">{t('noDecks')}</p>
              <p className="text-sm">{t('createFirst')}</p>
            </div>
          </div>
        ) : (
          <section className="flex min-h-0 flex-1 flex-col">
            <div className="grid min-h-0 auto-rows-fr gap-3 md:grid-cols-2">
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
