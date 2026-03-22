import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface ActivityDayProps {
  dayLabel: string
  reviews: number
  masteredWords: number
  isToday: boolean
}

export function ActivityDay({ dayLabel, reviews, masteredWords, isToday }: ActivityDayProps) {
  const isActive = reviews >= 1
  const hasMasteredWords = masteredWords > 0

  return (
    <div className="flex min-w-[42px] flex-col items-center gap-1">
      <span className="text-sm font-semibold text-slate-500">{dayLabel}</span>
      <Tooltip>
        <TooltipTrigger
          render={
            <span
              className={[
                "inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold",
                isActive
                  ? "border-emerald-600/25 bg-emerald-500/20 text-emerald-700"
                  : "border-slate-300 bg-slate-200/70 text-slate-400",
                isToday ? "ring-2 ring-emerald-800" : "",
              ].join(" ")}
            />
          }
          aria-label={
            hasMasteredWords
              ? `${dayLabel}: ${masteredWords} слов закреплено после тренировки в стадии review, ${reviews} повторений${isToday ? ", today" : ""}`
              : `${dayLabel}: закрепленных слов нет, ${reviews} повторений${isToday ? ", today" : ""}`
          }
        >
          {isActive ? (hasMasteredWords ? masteredWords : "✓") : <span className="grayscale opacity-65">😶</span>}
        </TooltipTrigger>
        <TooltipContent>
          {hasMasteredWords
            ? `${masteredWords} слов закрепилось после тренировки. Стадия: review. Повторений: ${reviews}.`
            : `Закрепленных слов после тренировки нет. Повторений: ${reviews}.`}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

export type { ActivityDayProps }
