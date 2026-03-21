"use client"

import * as React from "react"

type Rating = 1 | 2 | 3 | 4

interface RatingButtonsProps {
  onRate: (rating: Rating) => void
  intervals?: {
    again: string
    hard: string
    good: string
    easy: string
  }
  className?: string
  stickyMobile?: boolean
}

const BUTTONS: {
  rating: Rating
  label: string
  key: string
  colorClass: string
  hoverClass: string
  intervalKey: keyof NonNullable<RatingButtonsProps["intervals"]>
}[] = [
  {
    rating: 1,
    label: "Again",
    key: "1",
    colorClass: "border-destructive/40 text-destructive",
    hoverClass: "hover:bg-destructive/10 hover:border-destructive/70",
    intervalKey: "again",
  },
  {
    rating: 2,
    label: "Hard",
    key: "2",
    colorClass: "border-orange-400/40 text-orange-500 dark:text-orange-400",
    hoverClass: "hover:bg-orange-500/10 hover:border-orange-400/70",
    intervalKey: "hard",
  },
  {
    rating: 3,
    label: "Good",
    key: "3",
    colorClass: "border-green-400/40 text-green-600 dark:text-green-400",
    hoverClass: "hover:bg-green-500/10 hover:border-green-400/70",
    intervalKey: "good",
  },
  {
    rating: 4,
    label: "Easy",
    key: "4",
    colorClass: "border-blue-400/40 text-blue-600 dark:text-blue-400",
    hoverClass: "hover:bg-blue-500/10 hover:border-blue-400/70",
    intervalKey: "easy",
  },
]

export function RatingButtons({ onRate, intervals, className, stickyMobile = false }: RatingButtonsProps) {
  return (
    <div
      className={`grid grid-cols-4 gap-2 ${stickyMobile ? "sm:gap-2.5" : ""} ${className ?? ""}`}
      role="group"
      aria-label="Rate your recall"
    >
      {BUTTONS.map(({ rating, label, key, colorClass, hoverClass, intervalKey }) => (
        <button
          key={rating}
          type="button"
          onClick={() => onRate(rating)}
          aria-label={`${label} (key ${key})${intervals ? `, ${intervals[intervalKey]}` : ""}`}
          className={`
            flex flex-col items-center justify-center gap-0.5
            min-h-16 rounded-xl border px-1.5 py-2.5 sm:px-2
            text-center font-medium
            touch-manipulation [webkit-tap-highlight-color:transparent]
            transition-all duration-150
            active:scale-95 active:brightness-95
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
            bg-background/85 backdrop-blur-sm
            shadow-[inset_0_1px_0_hsl(var(--background)),0_10px_25px_-22px_hsl(var(--foreground)/0.45)]
            ${colorClass}
            ${hoverClass}
          `}
        >
          <span className="text-[0.95rem] font-semibold sm:text-sm">{label}</span>
          {intervals && (
            <span className="text-[10px] font-normal tabular-nums opacity-70">
              {intervals[intervalKey]}
            </span>
          )}
          <span className="text-[9px] opacity-40 font-normal mt-0.5">[{key}]</span>
        </button>
      ))}
    </div>
  )
}
