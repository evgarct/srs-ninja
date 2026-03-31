'use client'

import type { ActivityDaySummary } from '@/lib/activity'
import { cn } from '@/lib/utils'

export interface WeeklyActivityProps {
  days: ActivityDaySummary[]
  streak: number
}

function weekdayLabel(date: string) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`)
  )
}

export function WeeklyActivity({ days, streak }: WeeklyActivityProps) {
  const activeDays = days.filter((day) => day.reviews > 0).length
  const progress = Math.round((activeDays / Math.max(days.length, 1)) * 100)

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-3xl font-semibold tracking-[-0.06em] text-white">{streak}</p>
          <p className="text-sm text-white/54">days in a row</p>
        </div>
        <div className="min-w-28 rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-right">
          <p className="text-sm font-medium text-white">{progress}%</p>
          <p className="text-xs text-white/42">week complete</p>
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,rgba(255,246,122,1),rgba(197,132,255,1))]"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const isActive = day.reviews >= 1
          const label = weekdayLabel(day.date)

          return (
            <div key={day.date} className="flex flex-col items-center gap-2">
              <span className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-white/38">
                {label}
              </span>
              <div
                className={cn(
                  'flex h-12 w-full items-center justify-center rounded-2xl border text-sm font-semibold transition-colors',
                  isActive
                    ? 'border-primary/30 bg-primary/18 text-primary'
                    : day.isFuture
                      ? 'border-white/8 bg-white/[0.04] text-white/24'
                      : 'border-white/10 bg-white/[0.06] text-white/42',
                  day.isToday && 'shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_0_22px_rgba(201,134,255,0.22)]'
                )}
              >
                {isActive ? (day.masteredWords > 0 ? '✓' : '•') : day.isFuture ? '·' : '×'}
              </div>
              <span className="text-[0.65rem] text-white/40">{day.reviews > 0 ? day.reviews : ''}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
