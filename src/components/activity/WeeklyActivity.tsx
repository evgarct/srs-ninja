import { ActivityDay } from './ActivityDay'

export interface WeeklyActivityProps {
  days: {
    date: string
    reviews: number
    masteredWords: number
  }[]
  streak: number
}

function weekdayLabel(date: string) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))
}

export function WeeklyActivity({ days, streak }: WeeklyActivityProps) {
  const todayIndex = days.length - 1

  return (
    <section className="rounded-2xl border border-slate-200 bg-white py-3 text-slate-900">
      <div className="flex items-center justify-center gap-2">
        <span className="text-2xl leading-none">🔥</span>
        <p className="text-xl font-extrabold tracking-tight">{streak}</p>
        <p className="text-base font-bold text-amber-500">day streak!</p>
      </div>
      <div className="mt-4 px-3 py-1">
        <div className="flex items-start justify-between gap-2">
        {days.map((day, index) => (
          <ActivityDay
            key={day.date}
            dayLabel={weekdayLabel(day.date)}
            reviews={day.reviews}
            masteredWords={day.masteredWords}
            isToday={index === todayIndex}
          />
        ))}
        </div>
      </div>
    </section>
  )
}
