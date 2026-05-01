"use client"

import * as React from "react"
import { Heart, RotateCcw, Sparkles, X } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTranslations } from "next-intl"

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

const BUTTON_CONFIG: {
  rating: Rating
  key: string
  translationKey: 'ratingAgain' | 'ratingHard' | 'ratingGood' | 'ratingEasy'
  icon: React.ComponentType<{ className?: string }>
  sizeClass: string
  shellClass: string
  iconClass: string
  hoverClass: string
  intervalKey: keyof NonNullable<RatingButtonsProps["intervals"]>
}[] = [
  {
    rating: 1,
    translationKey: "ratingAgain",
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
    translationKey: "ratingHard",
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
    translationKey: "ratingGood",
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
    translationKey: "ratingEasy",
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
  const t = useTranslations("review")
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
        {BUTTON_CONFIG.map(({ rating, translationKey, key, icon: Icon, shellClass, iconClass, hoverClass, intervalKey }) => {
          const label = t(translationKey)
          const ariaLabel = `${label} (key ${key})${intervals ? `, ${intervals[intervalKey]}` : ""}`
          const tooltipText = intervals ? `${label} · ${intervals[intervalKey]}` : label

          if (isFloating) {
            const floatingToneClass =
              rating === 1
                ? "text-rose-300 hover:text-rose-200 hover:border-rose-300/28 hover:bg-rose-300/10"
                : rating === 2
                  ? "text-orange-300 hover:text-orange-200 hover:border-orange-300/28 hover:bg-orange-300/10"
                  : rating === 3
                    ? "text-sky-300 hover:text-sky-200 hover:border-sky-300/28 hover:bg-sky-300/10"
                    : "text-emerald-300 hover:text-emerald-200 hover:border-emerald-300/28 hover:bg-emerald-300/10"

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
                        h-[3.6rem] w-[3.6rem] sm:h-[3.9rem] sm:w-[3.9rem]
                        inline-flex items-center justify-center rounded-full
                        touch-manipulation [webkit-tap-highlight-color:transparent]
                        transition-all duration-200
                        border border-white/10 bg-white/[0.04]
                        active:scale-95 active:translate-y-0.5
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                        shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]
                        ${floatingToneClass}
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
