'use client'

import type { ActivityDaySummary } from '@/lib/activity'
import ReactBitsStepper, { Step } from '@/components/vendor/reactbits-stepper'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export interface WeeklyActivityProps {
  days: ActivityDaySummary[]
  streak: number
}

function weekdayLabel(date: string) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))
}

export function WeeklyActivity({ days, streak }: WeeklyActivityProps) {
  const todayIndex = days.findIndex((day) => day.isToday)

  return (
    <section className="rounded-2xl border bg-card px-3 py-3 text-card-foreground sm:px-4">
      <div className="flex items-center justify-center gap-2 text-center">
        <span className="text-lg leading-none">🔥</span>
        <p className="text-lg font-extrabold tracking-tight">{streak}</p>
        <p className="text-sm font-semibold text-amber-500">day streak!</p>
      </div>

      <div className="mt-3">
        <ReactBitsStepper
          initialStep={Math.max(todayIndex + 1, 1)}
          disableStepIndicators
          hideContent
          hideFooter
          outerClassName="w-full"
          stepCircleContainerClassName="rounded-none shadow-none"
          stepContainerClassName="gap-0 px-0 py-0"
          renderStepIndicator={({ step }) => {
            const day = days[step - 1]
            if (!day) return null

            const isActive = day.reviews >= 1
            const hasMasteredWords = day.masteredWords > 0
            const label = weekdayLabel(day.date)

            return (
              <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <span className="text-xs font-semibold text-slate-500">{label}</span>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <span
                        className={cn(
                          'inline-flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold sm:h-10 sm:w-10 sm:text-sm',
                          isActive
                            ? 'border-emerald-600/25 bg-emerald-500/20 text-emerald-700'
                            : day.isFuture
                              ? 'border-slate-200 bg-slate-100 text-slate-300'
                              : 'border-slate-300 bg-slate-200/70 text-slate-400',
                          day.isToday ? 'ring-2 ring-emerald-800' : ''
                        )}
                      />
                    }
                    aria-label={
                      hasMasteredWords
                        ? `${label}: ${day.masteredWords} слов закреплено после тренировки в стадии review, ${day.reviews} повторений${day.isToday ? ', today' : ''}`
                        : day.isFuture
                          ? `${label}: будущий день текущей недели`
                          : `${label}: закрепленных слов нет, ${day.reviews} повторений${day.isToday ? ', today' : ''}`
                    }
                  >
                    {isActive ? (hasMasteredWords ? day.masteredWords : '✓') : day.isFuture ? '•' : <span className="grayscale opacity-65">😶</span>}
                  </TooltipTrigger>
                  <TooltipContent>
                    {hasMasteredWords
                      ? `${day.masteredWords} слов закрепилось после тренировки. Стадия: review. Повторений: ${day.reviews}.`
                      : day.isFuture
                        ? 'Будущий день текущей недели.'
                        : `Закрепленных слов после тренировки нет. Повторений: ${day.reviews}.`}
                  </TooltipContent>
                </Tooltip>
              </div>
            )
          }}
        >
          {days.map((day) => (
            <Step key={day.date}>
              <span className="sr-only">{weekdayLabel(day.date)}</span>
            </Step>
          ))}
        </ReactBitsStepper>
      </div>
    </section>
  )
}
