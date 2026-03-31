"use client"

import { HeatmapCalendar, type HeatmapDatum } from '@/components/ui/calendar-heatmap'
import { getActivityIntensity, type HeatmapWeek } from '@/lib/activity'

export interface ReviewHeatmapProps {
  weeks: HeatmapWeek[]
}

const CELL_STYLES: Record<Exclude<ReturnType<typeof getActivityIntensity>, 0>, string> = {
  1: 'bg-[#3b2752] text-transparent hover:bg-[#3b2752]',
  2: 'bg-[#6b3696] text-transparent hover:bg-[#6b3696]',
  3: 'bg-[#9a57db] text-transparent hover:bg-[#9a57db]',
  4: 'bg-[#efff63] text-transparent hover:bg-[#efff63]',
}

export function ReviewHeatmap({ weeks }: ReviewHeatmapProps) {
  if (weeks.length === 0) return null

  const hasAnyActivity = weeks.some((week) => week.days.some((day) => day.reviews > 0))
  const heatmapData: HeatmapDatum[] = weeks
    .flatMap((week) => week.days)
    .filter((day) => !day.isFuture)
    .map((day) => ({
      date: day.date,
      value: day.reviews,
      meta: {
        masteredWords: day.masteredWords,
      },
    }))

  const endDateKey =
    weeks.flatMap((week) => week.days).find((day) => day.isToday)?.date ??
    weeks.at(-1)?.days.at(-1)?.date

  const sharedProps = {
    data: heatmapData,
    endDate: endDateKey ? new Date(`${endDateKey}T00:00:00Z`) : new Date(),
    weekStartsOn: 1 as const,
    cellSize: 17,
    cellGap: 3,
    axisLabels: {
      showWeekdays: false,
      showMonths: true,
      weekdayIndices: [1, 3, 5],
      monthFormat: 'short' as const,
      minWeekSpacing: 2,
    },
    levelClassNames: [
      'bg-white/[0.06]',
      CELL_STYLES[1],
      CELL_STYLES[2],
      CELL_STYLES[3],
      CELL_STYLES[4],
    ],
    legend: false,
    renderTooltip: (cell: {
      label: string
      value: number
      meta?: unknown
    }) => {
      const masteredWords = (cell.meta as { masteredWords?: number } | undefined)?.masteredWords ?? 0
      return (
        <div className="space-y-0.5">
          <div className="font-medium">{cell.label}</div>
          <div>{cell.value} reviews</div>
          <div>{masteredWords} mastered words</div>
        </div>
      )
    },
    className: 'w-fit text-white/70 [&_.text-muted-foreground]:text-white/42 [&_[data-slot=heatmap-axis]]:text-white/42',
  }

  return (
    <div className="flex flex-col items-center">
      <div className="block md:hidden">
        <HeatmapCalendar {...sharedProps} rangeDays={122} />
      </div>

      <div className="hidden md:block">
        <HeatmapCalendar {...sharedProps} rangeDays={274} />
      </div>

      {!hasAnyActivity ? (
        <p className="mt-4 text-center text-sm text-white/54">
          Активность пока не появилась. После первых review heatmap начнет показывать ритм обучения.
        </p>
      ) : null}
    </div>
  )
}
