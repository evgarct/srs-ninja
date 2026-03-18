import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getDashboardStats } from '@/lib/actions/decks'
import { getTodayStats, getWeeklyActivityStats } from '@/lib/actions/stats'
import Link from 'next/link'
import { buttonVariants } from '@/lib/button-variants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreateDeckDialog } from '@/components/create-deck-dialog'
import { ExtraStudyBox } from '@/components/extra-study-box'
import { cn } from '@/lib/utils'
import { WeeklyActivity } from '@/components/activity'
import { headers } from 'next/headers'

const DECK_EMOJI: Record<string, string> = {
  czech: '🇨🇿',
  english: '🇬🇧',
}

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

  const [deckStats, todayStats, weeklyActivity] = await Promise.all([
    getDashboardStats(),
    getTodayStats(),
    getWeeklyActivityStats(timeZone),
  ])

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">SRS Ninja</h1>
        <CreateDeckDialog />
      </div>

      {/* Today stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Сегодня</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{todayStats.total}</p>
            <p className="text-xs text-muted-foreground">повторений</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Точность</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{todayStats.accuracy}%</p>
            <p className="text-xs text-muted-foreground">{todayStats.correct} правильных</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Среднее время</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {todayStats.avgDuration > 0 ? `${(todayStats.avgDuration / 1000).toFixed(1)}s` : '—'}
            </p>
            <p className="text-xs text-muted-foreground">на карточку</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <WeeklyActivity days={weeklyActivity.days} streak={weeklyActivity.streak} />
      </div>

      {/* Decks */}
      {deckStats.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg mb-2">Нет колод</p>
          <p className="text-sm">Создайте первую колоду, чтобы начать</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {deckStats.map(({ deck, due, total, drafts }) => (
            <Card key={deck.id} className="hover:border-foreground/30 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">
                    {DECK_EMOJI[deck.language] ?? '📚'} {deck.name}
                  </CardTitle>
                  <div className="flex gap-2">
                    {drafts > 0 && <Badge variant="outline">{drafts} draft</Badge>}
                    {due > 0 && (
                      <Badge variant="destructive">{due} к повторению</Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{total} карточек всего</p>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {due > 0 ? (
                  <div className="flex gap-2">
                    <Link href={`/decks/${deck.id}/review`} className={cn(buttonVariants(), 'flex-1 text-center')}>
                      Учить ({due})
                    </Link>
                    <Link href={`/deck/${deck.id}`} className={buttonVariants({ variant: 'outline' })}>
                      Колода
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <Link href={`/deck/${deck.id}`} className={cn(buttonVariants({ variant: 'outline' }), 'flex-1 text-center')}>
                        Открыть колоду
                      </Link>
                      {drafts > 0 && (
                        <Link href={`/deck/${deck.id}/drafts`} className={buttonVariants({ variant: 'outline' })}>
                          Drafts
                        </Link>
                      )}
                    </div>
                    <ExtraStudyBox deckId={deck.id} hasStudiedToday={todayStats.total > 0} />
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
