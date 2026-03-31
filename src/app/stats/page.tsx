import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  getCardStateDistribution,
  getReviewStats,
  getTodayStats,
  getWeeklyActivityStats,
} from '@/lib/actions/stats'
import { Card, CardContent } from '@/components/ui/card'
import { headers } from 'next/headers'
import { ReviewHeatmap, WeeklyActivity } from '@/components/activity'
import { buildReviewHeatmapWeeks } from '@/lib/activity'
import { cn } from '@/lib/utils'

export default async function StatsPage() {
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

  const [reviews, todayStats, distribution, weeklyActivity] = await Promise.all([
    getReviewStats(280),
    getTodayStats(),
    getCardStateDistribution(),
    getWeeklyActivityStats(timeZone),
  ])

  const totalReviews = reviews.length
  const totalCorrect = reviews.filter((review) => review.rating >= 3).length
  const overallAccuracy = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0
  const totalCards = Object.values(distribution).reduce((sum, count) => sum + count, 0)
  const heatmap = buildReviewHeatmapWeeks(reviews, timeZone, { weeks: 39 })
  const currentMonthLabel = new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric',
    timeZone,
  }).format(new Date())

  const progressCards = [
    {
      key: 'streak',
      value: weeklyActivity.streak,
      label: 'day streak',
      className: 'bg-[linear-gradient(180deg,rgba(255,244,120,1),rgba(245,165,233,0.85))] text-black',
    },
    {
      key: 'accuracy',
      value: `${overallAccuracy}%`,
      label: 'accuracy',
      className: 'bg-white/[0.06] text-white',
    },
    {
      key: 'cards',
      value: totalCards,
      label: 'cards',
      className: 'bg-white/[0.06] text-white',
    },
  ]

  return (
    <main className="app-shell">
      <section className="app-panel px-5 py-5 sm:px-6 sm:py-6">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(203,130,255,0.35),transparent_72%)] blur-3xl" />
        <div className="relative space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white/52">Profile</p>
              <h1 className="text-3xl font-semibold tracking-[-0.05em] text-white">Прогресс</h1>
            </div>
            <span className="app-pill border-primary/30 bg-primary/10 text-primary">
              {todayStats.total} today
            </span>
          </div>

          <p className="max-w-lg text-sm leading-6 text-white/62">
            Короткий обзор сессий, streak и общей динамики без лишней аналитической перегрузки.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        {progressCards.map((item) => (
          <Card key={item.key} className={cn('rounded-[24px] border-none py-0 shadow-none', item.className)}>
            <CardContent className="flex min-h-32 flex-col justify-between px-4 py-4">
              <div className="text-[0.7rem] uppercase tracking-[0.22em] opacity-60">{item.label}</div>
              <div>
                <p className="text-4xl font-semibold tracking-[-0.06em]">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="app-panel px-4 py-4 sm:px-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-white">Streak goal</p>
            <p className="text-sm text-white/54">
              {weeklyActivity.activeDays} из 7 дней активны на этой неделе
            </p>
          </div>
          <span className="app-pill">{weeklyActivity.streak} streak</span>
        </div>
        <WeeklyActivity days={weeklyActivity.days} streak={weeklyActivity.streak} />
      </section>

      <section className="app-panel px-4 py-4 sm:px-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-white capitalize">{currentMonthLabel}</p>
            <p className="text-sm text-white/54">История review и плотность практики</p>
          </div>
          <span className="app-pill">{totalReviews} reviews</span>
        </div>
        <ReviewHeatmap weeks={heatmap.weeks} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Card className="app-panel py-0">
          <CardContent className="px-4 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-white/42">today</p>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div>
                <p className="text-2xl font-semibold tracking-[-0.05em] text-white">{todayStats.total}</p>
                <p className="text-xs text-white/48">reviews</p>
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-[-0.05em] text-white">{todayStats.accuracy}%</p>
                <p className="text-xs text-white/48">accuracy</p>
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-[-0.05em] text-white">
                  {todayStats.avgDuration > 0 ? `${(todayStats.avgDuration / 1000).toFixed(1)}s` : '—'}
                </p>
                <p className="text-xs text-white/48">avg time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="app-panel py-0">
          <CardContent className="px-4 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-white/42">library</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {(Object.entries(distribution) as Array<[string, number]>).map(([state, count]) => (
                <div key={state} className="app-panel-muted px-3 py-3">
                  <p className="text-xs capitalize text-white/48">{state}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">{count}</p>
                  <p className="text-xs text-white/42">
                    {totalCards > 0 ? Math.round((count / totalCards) * 100) : 0}%
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
