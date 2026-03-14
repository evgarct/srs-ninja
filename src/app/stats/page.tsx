import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getReviewStats, getTodayStats, getCardStateDistribution } from '@/lib/actions/stats'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function groupByDay(reviews: Array<{ reviewed_at: string; rating: number }>) {
  const map = new Map<string, { total: number; correct: number }>()
  for (const r of reviews) {
    const day = r.reviewed_at.slice(0, 10)
    const entry = map.get(day) ?? { total: 0, correct: 0 }
    entry.total++
    if (r.rating >= 3) entry.correct++
    map.set(day, entry)
  }
  return map
}

export default async function StatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [reviews, todayStats, distribution] = await Promise.all([
    getReviewStats(30),
    getTodayStats(),
    getCardStateDistribution(),
  ])

  const byDay = groupByDay(reviews)
  const totalReviews = reviews.length
  const totalCorrect = reviews.filter((r) => r.rating >= 3).length
  const overallAccuracy = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0

  const totalCards = Object.values(distribution).reduce((a, b) => a + b, 0)

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

      {/* 30 days */}
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">30 дней</h2>
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

      {/* Calendar heatmap (simple) */}
      {byDay.size > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Активность (последние 30 дней)
          </h2>
          <div className="flex flex-wrap gap-1">
            {Array.from(byDay.entries()).map(([day, { total }]) => (
              <div
                key={day}
                className="w-8 h-8 rounded text-xs flex items-center justify-center font-medium"
                style={{
                  backgroundColor: total === 0 ? undefined
                    : total < 10 ? 'hsl(142 50% 80%)'
                    : total < 30 ? 'hsl(142 50% 60%)'
                    : 'hsl(142 50% 40%)',
                  color: total >= 30 ? 'white' : undefined,
                }}
                title={`${day}: ${total} повторений`}
              >
                {total}
              </div>
            ))}
          </div>
        </div>
      )}

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
