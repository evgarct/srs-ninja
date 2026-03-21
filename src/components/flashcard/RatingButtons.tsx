"use client"

import * as React from "react"
import { Heart, RotateCcw, Sparkles, X } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type Rating = 1 | 2 | 3 | 4

interface RatingButtonsProps {
  onRate: (rating: Rating) => void
  onRatePress?: (rating: Rating, button: HTMLButtonElement) => void
  intervals?: {
    again: string
    hard: string
    good: string
    easy: string
  }
  className?: string
  stickyMobile?: boolean
  visualStyle?: "default" | "floating"
}

const BUTTONS: {
  rating: Rating
  label: string
  key: string
  icon: React.ComponentType<{ className?: string }>
  sizeClass: string
  shellClass: string
  iconClass: string
  hoverClass: string
  intervalKey: keyof NonNullable<RatingButtonsProps["intervals"]>
}[] = [
  {
    rating: 1,
    label: "Again",
    key: "1",
    icon: RotateCcw,
    sizeClass: "h-[4.15rem] w-[4.15rem] sm:h-[4.4rem] sm:w-[4.4rem]",
    shellClass: "bg-white text-rose-500 shadow-[0_22px_34px_-18px_rgba(15,23,42,0.22),0_10px_22px_-14px_rgba(244,63,94,0.5)]",
    iconClass: "h-[1.35rem] w-[1.35rem]",
    hoverClass: "hover:-translate-y-0.5 hover:shadow-[0_18px_32px_-16px_rgba(244,63,94,0.46)]",
    intervalKey: "again",
  },
  {
    rating: 2,
    label: "Hard",
    key: "2",
    icon: X,
    sizeClass: "h-[4.15rem] w-[4.15rem] sm:h-[4.4rem] sm:w-[4.4rem]",
    shellClass: "bg-white text-orange-500 shadow-[0_22px_34px_-18px_rgba(15,23,42,0.22),0_10px_22px_-14px_rgba(249,115,22,0.5)]",
    iconClass: "h-[1.35rem] w-[1.35rem]",
    hoverClass: "hover:-translate-y-0.5 hover:shadow-[0_22px_34px_-16px_rgba(249,115,22,0.45)]",
    intervalKey: "hard",
  },
  {
    rating: 3,
    label: "Good",
    key: "3",
    icon: Sparkles,
    sizeClass: "h-[4.15rem] w-[4.15rem] sm:h-[4.4rem] sm:w-[4.4rem]",
    shellClass: "bg-white text-sky-500 shadow-[0_22px_34px_-18px_rgba(15,23,42,0.22),0_10px_22px_-14px_rgba(14,165,233,0.5)]",
    iconClass: "h-[1.35rem] w-[1.35rem]",
    hoverClass: "hover:-translate-y-0.5 hover:shadow-[0_25px_40px_-16px_rgba(14,165,233,0.45)]",
    intervalKey: "good",
  },
  {
    rating: 4,
    label: "Easy",
    key: "4",
    icon: Heart,
    sizeClass: "h-[4.15rem] w-[4.15rem] sm:h-[4.4rem] sm:w-[4.4rem]",
    shellClass: "bg-white text-emerald-500 shadow-[0_22px_34px_-18px_rgba(15,23,42,0.22),0_10px_22px_-14px_rgba(16,185,129,0.48)]",
    iconClass: "h-[1.35rem] w-[1.35rem]",
    hoverClass: "hover:-translate-y-0.5 hover:shadow-[0_22px_34px_-16px_rgba(16,185,129,0.42)]",
    intervalKey: "easy",
  },
]

export function RatingButtons({
  onRate,
  onRatePress,
  intervals,
  className,
  stickyMobile = false,
  visualStyle = "default",
}: RatingButtonsProps) {
  const isFloating = visualStyle === "floating"

  return (
    <TooltipProvider delay={0} closeDelay={0}>
      <div
        className={
          isFloating
            ? `flex items-end justify-center gap-2.5 sm:gap-4 ${className ?? ""}`
            : `grid grid-cols-4 gap-2 ${stickyMobile ? "sm:gap-2.5" : ""} ${className ?? ""}`
        }
        role="group"
        aria-label="Rate your recall"
      >
        {BUTTONS.map(({ rating, label, key, icon: Icon, sizeClass, shellClass, iconClass, hoverClass, intervalKey }) => {
          const ariaLabel = `${label} (key ${key})${intervals ? `, ${intervals[intervalKey]}` : ""}`
          const tooltipText = intervals ? `${label} · ${intervals[intervalKey]}` : label

          if (isFloating) {
            return (
              <Tooltip key={rating}>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={(event) => {
                        onRatePress?.(rating, event.currentTarget)
                        onRate(rating)
                      }}
                      aria-label={ariaLabel}
                      className={`
                        ${sizeClass}
                        inline-flex items-center justify-center rounded-full
                        touch-manipulation [webkit-tap-highlight-color:transparent]
                        transition-all duration-200
                        border border-white/80
                        active:scale-95 active:translate-y-0.5
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                        ${shellClass}
                        ${hoverClass}
                      `}
                    >
                      <Icon className={iconClass} />
                    </button>
                  }
                />
                <TooltipContent side="top" sideOffset={10}>
                  {tooltipText}
                </TooltipContent>
              </Tooltip>
            )
          }

          return (
            <button
              key={rating}
              type="button"
              onClick={(event) => {
                onRatePress?.(rating, event.currentTarget)
                onRate(rating)
              }}
              aria-label={ariaLabel}
              className={`
                flex aspect-square min-h-[4.6rem] flex-col items-center justify-center gap-0.5
                rounded-full border px-1 py-2 sm:min-h-[5rem] sm:px-2
                text-center font-medium
                touch-manipulation [webkit-tap-highlight-color:transparent]
                transition-all duration-150
                active:scale-95 active:brightness-95
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                border-white/55 bg-white/92 backdrop-blur-sm
                shadow-[0_16px_30px_-22px_hsl(var(--foreground)/0.45)]
                ${shellClass}
                ${hoverClass}
              `}
            >
              <Icon className={iconClass} />
              {intervals && (
                <span className="mt-1 text-[10px] font-normal leading-none tabular-nums opacity-70 sm:text-[11px]">
                  {intervals[intervalKey]}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
