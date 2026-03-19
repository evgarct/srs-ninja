"use client"

import * as React from 'react'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export type HeatmapDatum = {
  date: string | Date
  value: number
  meta?: unknown
}

export type HeatmapCell = {
  date: Date
  key: string
  value: number
  level: number
  label: string
  disabled: boolean
  meta?: unknown
}

export type LegendConfig = {
  show?: boolean
  lessText?: React.ReactNode
  moreText?: React.ReactNode
  className?: string
}

export type AxisLabelsConfig = {
  show?: boolean
  showWeekdays?: boolean
  showMonths?: boolean
  weekdayIndices?: number[]
  monthFormat?: 'short' | 'long' | 'numeric'
  minWeekSpacing?: number
  className?: string
}

export type HeatmapCalendarProps = {
  data: HeatmapDatum[]
  rangeDays?: number
  endDate?: Date
  weekStartsOn?: 0 | 1
  cellSize?: number
  cellGap?: number
  onCellClick?: (cell: HeatmapCell) => void
  levelClassNames?: string[]
  legend?: boolean | LegendConfig
  axisLabels?: boolean | AxisLabelsConfig
  renderTooltip?: (cell: HeatmapCell) => React.ReactNode
  className?: string
}

function startOfDay(date: Date) {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function toKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDate(input: string | Date) {
  if (input instanceof Date) return startOfDay(input)
  return startOfDay(new Date(`${input}T00:00:00`))
}

function startOfWeek(date: Date, weekStartsOn: 0 | 1) {
  const normalized = startOfDay(date)
  const day = normalized.getDay()
  const diff = (day - weekStartsOn + 7) % 7
  normalized.setDate(normalized.getDate() - diff)
  return normalized
}

function getLevel(value: number) {
  if (value <= 0) return 0
  if (value <= 2) return 1
  if (value <= 5) return 2
  if (value <= 10) return 3
  return 4
}

function sameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth()
}

function formatMonth(date: Date, format: 'short' | 'long' | 'numeric') {
  if (format === 'numeric') {
    const year = String(date.getFullYear()).slice(-2)
    return `${date.getMonth() + 1}/${year}`
  }

  return date.toLocaleDateString(undefined, { month: format })
}

function weekdayLabelForIndex(index: number, weekStartsOn: 0 | 1) {
  const actualDay = (weekStartsOn + index) % 7
  const base = new Date(Date.UTC(2024, 0, 7 + actualDay))
  return base
    .toLocaleDateString('ru-RU', { weekday: 'short' })
    .replace('.', '')
    .slice(0, 2)
    .toUpperCase()
}

export function HeatmapCalendar({
  data,
  rangeDays = 84,
  endDate = new Date(),
  weekStartsOn = 1,
  cellSize = 12,
  cellGap = 3,
  onCellClick,
  levelClassNames,
  legend = true,
  axisLabels = true,
  renderTooltip,
  className,
}: HeatmapCalendarProps) {
  const levels = levelClassNames ?? [
    'bg-muted',
    'bg-emerald-100',
    'bg-emerald-200',
    'bg-emerald-300',
    'bg-emerald-500',
  ]

  const legendConfig: LegendConfig =
    legend === true ? {} : legend === false ? { show: false } : legend
  const axisConfig: AxisLabelsConfig =
    axisLabels === true ? {} : axisLabels === false ? { show: false } : axisLabels

  const showAxis = axisConfig.show ?? true
  const showWeekdays = axisConfig.showWeekdays ?? true
  const showMonths = axisConfig.showMonths ?? true
  const weekdayIndices = axisConfig.weekdayIndices ?? [1, 3, 5]
  const monthFormat = axisConfig.monthFormat ?? 'short'
  const minWeekSpacing = axisConfig.minWeekSpacing ?? 3

  const end = startOfDay(endDate)
  const start = addDays(end, -(rangeDays - 1))
  const firstWeek = startOfWeek(start, weekStartsOn)

  const valueMap = React.useMemo(() => {
    const map = new Map<string, { value: number; meta?: unknown }>()

    for (const item of data) {
      const date = parseDate(item.date)
      const key = toKey(date)
      const previous = map.get(key)
      map.set(key, {
        value: (previous?.value ?? 0) + (item.value ?? 0),
        meta: item.meta ?? previous?.meta,
      })
    }

    return map
  }, [data])

  const totalDays = Math.ceil((end.getTime() - firstWeek.getTime()) / 86400000) + 1
  const weeks = Math.ceil(totalDays / 7)

  const cells = React.useMemo(() => {
    const nextCells: HeatmapCell[] = []

    for (let weekIndex = 0; weekIndex < weeks; weekIndex++) {
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const date = addDays(firstWeek, weekIndex * 7 + dayIndex)
        const key = toKey(date)
        const inRange = date >= start && date <= end
        const entry = valueMap.get(key)
        const value = inRange ? (entry?.value ?? 0) : 0

        nextCells.push({
          date,
          key,
          value,
          level: inRange ? getLevel(value) : 0,
          disabled: !inRange,
          meta: inRange ? entry?.meta : undefined,
          label: date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
        })
      }
    }

    return nextCells
  }, [end, firstWeek, start, valueMap, weeks])

  const columns = React.useMemo(
    () => Array.from({ length: weeks }, (_, index) => cells.slice(index * 7, index * 7 + 7)),
    [cells, weeks]
  )
  const visibleColumns = React.useMemo(() => {
    const firstVisibleCell = cells.find((cell) => !cell.disabled)
    if (!firstVisibleCell) return columns
    if (firstVisibleCell.date.getDate() === 1) return columns

    return columns.filter((column) => {
      const firstActiveCell = column.find((cell) => !cell.disabled)
      if (!firstActiveCell) return false

      return !sameMonth(firstActiveCell.date, firstVisibleCell.date)
    })
  }, [cells, columns])

  const monthLabels = React.useMemo(() => {
    if (!showAxis || !showMonths) return [] as { colIndex: number; text: string }[]

    const labels: { colIndex: number; text: string }[] = []
    let lastLabelWeek = -999

    for (let index = 0; index < visibleColumns.length; index++) {
      const current = visibleColumns[index]
      const currentDate = current.find((cell) => !cell.disabled)?.date ?? current[0].date
      const hasDisabledBeforeVisible = current.findIndex((cell) => !cell.disabled) > 0
      const previous = index > 0 ? visibleColumns[index - 1] : null
      const previousDate = previous?.find((cell) => !cell.disabled)?.date ?? previous?.[0]?.date

      if (
        !hasDisabledBeforeVisible &&
        (!previousDate || !sameMonth(currentDate, previousDate)) &&
        index - lastLabelWeek >= minWeekSpacing
      ) {
        labels.push({ colIndex: index, text: formatMonth(currentDate, monthFormat) })
        lastLabelWeek = index
      }
    }

    return labels
  }, [visibleColumns, minWeekSpacing, monthFormat, showAxis, showMonths])
  const resolvedCellSize = cellSize
  const gutterWidth = showAxis && showWeekdays ? resolvedCellSize + 20 : 0
  const columnStride = resolvedCellSize + cellGap
  const gridWidth = visibleColumns.length * columnStride - cellGap

  return (
    <TooltipProvider>
      <div className={cn('space-y-3', className)}>
        {showAxis && showMonths && (
          <div className="flex">
            {showWeekdays && <div style={{ width: `${gutterWidth}px` }} />}
            <div className="relative h-4" style={{ width: `${gridWidth}px` }}>
              {monthLabels.map((label) => (
                <span
                  key={`${label.colIndex}-${label.text}`}
                  className="absolute top-0 text-[11px] text-muted-foreground"
                  style={{ left: `${label.colIndex * columnStride}px` }}
                >
                  {label.text}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {showAxis && showWeekdays && (
            <div className="flex flex-col" style={{ gap: `${cellGap}px`, width: `${gutterWidth}px` }}>
              {Array.from({ length: 7 }, (_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-end pr-2 text-[11px] text-muted-foreground"
                  style={{ height: `${resolvedCellSize}px` }}
                >
                  {weekdayIndices.includes(index) ? weekdayLabelForIndex(index, weekStartsOn) : ''}
                </div>
              ))}
            </div>
          )}

          <div className="flex" style={{ gap: `${cellGap}px` }}>
            {visibleColumns.map((column, columnIndex) => (
              <div key={columnIndex} className="flex flex-col" style={{ gap: `${cellGap}px` }}>
                {column.map((cell) => {
                  const tooltip = renderTooltip ? renderTooltip(cell) : `${cell.value} reviews on ${cell.label}`

                  return (
                    <Tooltip key={cell.key}>
                      <TooltipTrigger
                        render={
                          <button
                            type="button"
                            onClick={() => onCellClick?.(cell)}
                            className={cn(
                              'rounded-[4px] border border-transparent transition-colors',
                              cell.disabled ? 'cursor-default opacity-0' : 'cursor-pointer hover:ring-1 hover:ring-foreground/20',
                              levels[cell.level]
                            )}
                            style={{ width: `${resolvedCellSize}px`, height: `${resolvedCellSize}px` }}
                            aria-label={`${cell.label}: ${cell.value}`}
                            disabled={cell.disabled}
                          />
                        }
                      />
                      {!cell.disabled && tooltip && <TooltipContent>{tooltip}</TooltipContent>}
                    </Tooltip>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {(legendConfig.show ?? true) && (
          <div className={cn('flex items-center justify-end gap-2 text-xs text-muted-foreground', legendConfig.className)}>
            <span>{legendConfig.lessText ?? 'Less'}</span>
            <div className="flex items-center" style={{ gap: `${cellGap}px` }}>
              {levels.map((levelClassName, index) => (
                <span
                  key={index}
                  className={cn('rounded-[4px] border border-transparent', levelClassName)}
                  style={{ width: `${resolvedCellSize}px`, height: `${resolvedCellSize}px` }}
                />
              ))}
            </div>
            <span>{legendConfig.moreText ?? 'More'}</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
