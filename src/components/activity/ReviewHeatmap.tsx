"use client"

import { Card, CardContent } from '@/components/ui/card'
import { HeatmapCalendar, type HeatmapDatum } from '@/components/ui/calendar-heatmap'
import { getActivityIntensity, type HeatmapWeek } from '@/lib/activity'

export interface ReviewHeatmapProps {
  weeks: HeatmapWeek[]
}

const CELL_STYLES: Record<Exclude<ReturnType<typeof getActivityIntensity>, 0>, string> = {
  1: 'bg-emerald-100 text-transparent hover:bg-emerald-100',
  2: 'bg-emerald-200 text-transparent hover:bg-emerald-200',
  3: 'bg-emerald-300 text-transparent hover:bg-emerald-300',
  4: 'bg-emerald-500 text-transparent hover:bg-emerald-500',
}

export function ReviewHeatmap({
  weeks,
}: ReviewHeatmapProps) {
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
  const endDateKey = weeks.flatMap((week) => week.days).find((day) => day.isToday)?.date ?? weeks.at(-1)?.days.at(-1)?.date

  return (
    <Card>
      <CardContent className="flex flex-col items-center">
        <div className="block md:hidden">
          <HeatmapCalendar
            data={heatmapData}
            rangeDays={122}
            endDate={endDateKey ? new Date(`${endDateKey}T00:00:00Z`) : new Date()}
            weekStartsOn={1}
            cellSize={17}
            cellGap={3}
            axisLabels={{
              showWeekdays: false,
              showMonths: true,
              weekdayIndices: [1, 3, 5],
              monthFormat: 'short',
              minWeekSpacing: 2,
            }}
            levelClassNames={[
              'bg-muted',
              CELL_STYLES[1],
              CELL_STYLES[2],
              CELL_STYLES[3],
              CELL_STYLES[4],
            ]}
            legend={false}
            renderTooltip={(cell) => {
              const masteredWords = (cell.meta as { masteredWords?: number } | undefined)?.masteredWords ?? 0
              return (
                <div className="space-y-0.5">
                  <div className="font-medium">{cell.label}</div>
                  <div>{cell.value} reviews</div>
                  <div>{masteredWords} mastered words</div>
                </div>
              )
            }}
            className="w-fit"
          />
        </div>

        <div className="hidden md:block">
          <HeatmapCalendar
            data={heatmapData}
            rangeDays={274}
            endDate={endDateKey ? new Date(`${endDateKey}T00:00:00Z`) : new Date()}
            weekStartsOn={1}
            cellSize={17}
            cellGap={3}
            axisLabels={{
              showWeekdays: false,
              showMonths: true,
              weekdayIndices: [1, 3, 5],
              monthFormat: 'short',
              minWeekSpacing: 2,
            }}
            levelClassNames={[
              'bg-muted',
              CELL_STYLES[1],
              CELL_STYLES[2],
              CELL_STYLES[3],
              CELL_STYLES[4],
            ]}
            legend={false}
            renderTooltip={(cell) => {
              const masteredWords = (cell.meta as { masteredWords?: number } | undefined)?.masteredWords ?? 0
              return (
                <div className="space-y-0.5">
                  <div className="font-medium">{cell.label}</div>
                  <div>{cell.value} reviews</div>
                  <div>{masteredWords} mastered words</div>
                </div>
              )
            }}
            className="w-fit"
          />
        </div>

        {!hasAnyActivity && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            No review activity yet. Once you start reviewing, this heatmap will show how your study rhythm builds over time.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
