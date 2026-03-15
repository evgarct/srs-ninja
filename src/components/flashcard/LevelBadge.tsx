import * as React from "react"

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2"

const LEVEL_CONFIG: Record<CEFRLevel, { color: string; label: string }> = {
  A1: { color: "#22c55e", label: "A1" },
  A2: { color: "#eab308", label: "A2" },
  B1: { color: "#3b82f6", label: "B1" },
  B2: { color: "#a855f7", label: "B2" },
  C1: { color: "#f97316", label: "C1" },
  C2: { color: "#7c3aed", label: "C2" },
}

interface LevelBadgeProps {
  level: CEFRLevel
  className?: string
}

export function LevelBadge({ level, className }: LevelBadgeProps) {
  const { color, label } = LEVEL_CONFIG[level]

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className ?? ""}`}
      title={`CEFR Level ${label}`}
    >
      <span
        className="inline-block h-3 w-3 rounded-sm flex-shrink-0"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span className="text-xs font-semibold text-foreground/80 tracking-wide">
        {label}
      </span>
    </span>
  )
}
