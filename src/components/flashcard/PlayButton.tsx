"use client"

import * as React from "react"
import { Volume2 } from "lucide-react"

interface PlayButtonProps {
  onPlay: () => void
  className?: string
  disabled?: boolean
}

export function PlayButton({ onPlay, className, disabled }: PlayButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onPlay()
      }}
      disabled={disabled}
      aria-label="Play pronunciation"
      className={`
        group inline-flex h-10 w-10 items-center justify-center
        rounded-full
        border border-foreground/15
        bg-background/60 backdrop-blur-sm
        text-foreground/70
        transition-all duration-200
        hover:border-foreground/30 hover:bg-foreground/8 hover:text-foreground
        hover:scale-105
        active:scale-95
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
        ${className ?? ""}
      `}
    >
      <Volume2 className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
    </button>
  )
}
