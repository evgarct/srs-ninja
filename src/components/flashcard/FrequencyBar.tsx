import * as React from "react"

interface FrequencyBarProps {
  frequency: number // 1–10
  className?: string
}

export function FrequencyBar({ frequency, className }: FrequencyBarProps) {
  const clamped = Math.max(1, Math.min(10, frequency))

  return (
    <div
      className={`inline-flex items-center gap-2 ${className ?? ""}`}
      title={`Frequency: ${clamped}/10`}
      aria-label={`Frequency ${clamped} out of 10`}
    >
      <span className="flex gap-px font-mono text-sm leading-none">
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className={
              i < clamped
                ? "text-foreground"
                : "text-foreground/20"
            }
          >
            {i < clamped ? "▰" : "▱"}
          </span>
        ))}
      </span>
      <span className="text-xs text-muted-foreground font-medium">
        {clamped}/10
      </span>
    </div>
  )
}
