import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getReviewStats, getTodayStats, getCardStateDistribution } from '@/lib/actions/stats'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { headers } from 'next/headers'
import { ReviewHeatmap } from '@/components/activity'
import { buildReviewHeatmapWeeks } from '@/lib/activity'

export default async function StatsPage() {
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

  const [reviews, todayStats, distribution] = await Promise.all([
    getReviewStats(280),
    getTodayStats(),
    getCardStateDistribution(),
  ])

  const totalReviews = reviews.length
  const totalCorrect = reviews.filter((r) => r.rating >= 3).length
  const overallAccuracy = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0

  const totalCards = Object.values(distribution).reduce((a, b) => a + b, 0)
  const heatmap = buildReviewHeatmapWeeks(reviews, timeZone, { weeks: 39 })

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Статистика</h1>

      {/* Today */}
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Сегодня</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Повторений</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{todayStats.total}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Точность</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{todayStats.accuracy}%</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Среднее время</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {todayStats.avgDuration > 0 ? `${(todayStats.avgDuration / 1000).toFixed(1)}s` : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">История активности</h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Всего повторений</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalReviews}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Общая точность</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{overallAccuracy}%</p></CardContent>
        </Card>
      </div>

      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Review Heatmap</h2>
      <div className="mb-8">
        <ReviewHeatmap weeks={heatmap.weeks} />
      </div>

      {/* Card state distribution */}
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
        Состояние карточек ({totalCards} всего)
      </h2>
      <div className="grid grid-cols-4 gap-4">
        {(Object.entries(distribution) as Array<[string, number]>).map(([state, count]) => (
          <Card key={state}>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm text-muted-foreground capitalize">{state}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground">
                {totalCards > 0 ? Math.round((count / totalCards) * 100) : 0}%
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
