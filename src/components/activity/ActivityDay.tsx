import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface ActivityDayProps {
  dayLabel: string
  reviews: number
  masteredWords: number
  isToday: boolean
  isFuture?: boolean
  showConnector?: boolean
}

export function ActivityDay({
  dayLabel,
  reviews,
  masteredWords,
  isToday,
  isFuture = false,
  showConnector = false,
}: ActivityDayProps) {
  const isActive = reviews >= 1
  const hasMasteredWords = masteredWords > 0
  const connectorClassName = isActive
    ? 'bg-emerald-500/50'
    : isFuture
      ? 'bg-slate-200/50'
      : 'bg-slate-300/70'

  return (
    <div className="relative flex min-w-0 flex-1 flex-col items-center gap-1">
      <span className="text-xs font-semibold text-slate-500">{dayLabel}</span>
      <Tooltip>
        <TooltipTrigger
          render={
            <span
              className={[
                "inline-flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold sm:h-10 sm:w-10 sm:text-sm",
                isActive
                  ? "border-emerald-600/25 bg-emerald-500/20 text-emerald-700"
                  : isFuture
                    ? "border-slate-200 bg-slate-100 text-slate-300"
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
          {isActive ? (hasMasteredWords ? masteredWords : "✓") : isFuture ? '•' : <span className="grayscale opacity-65">😶</span>}
        </TooltipTrigger>
        <TooltipContent>
          {hasMasteredWords
            ? `${masteredWords} слов закрепилось после тренировки. Стадия: review. Повторений: ${reviews}.`
            : isFuture
              ? `Будущий день текущей недели. Сегодняшняя активность еще не наступила.`
              : `Закрепленных слов после тренировки нет. Повторений: ${reviews}.`}
        </TooltipContent>
      </Tooltip>
      {showConnector ? (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute left-[calc(50%+18px)] top-[29px] h-[2px] w-[calc(100%-36px)] sm:left-[calc(50%+20px)] sm:top-[31px] sm:w-[calc(100%-40px)] ${connectorClassName}`}
        />
      ) : null}
    </div>
  )
}

export type { ActivityDayProps }
