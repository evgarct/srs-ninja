'use client'

import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, type MotionValue, type SpringOptions } from 'motion/react'
import { AlertTriangle, Check, RotateCcw, Sparkles } from 'lucide-react'
import React, { useRef } from 'react'

import type { Rating } from '@/lib/types'

type DockItemData = {
  rating: Rating
  icon: React.ReactNode
  label: React.ReactNode
  interval?: string
  onClick: () => void
  className?: string
}

type DockProps = {
  items: DockItemData[]
  className?: string
  distance?: number
  baseItemSize?: number
  magnification?: number
  spring?: SpringOptions
}

type DockItemProps = {
  className?: string
  children: React.ReactNode
  onClick?: () => void
  mouseX: MotionValue<number>
  spring: SpringOptions
  distance: number
  baseItemSize: number
  magnification: number
}

function DockItem({
  children,
  className = '',
  onClick,
  mouseX,
  spring,
  distance,
  magnification,
  baseItemSize,
}: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isHovered = useMotionValue(0)

  const mouseDistance = useTransform(mouseX, (val) => {
    const rect = ref.current?.getBoundingClientRect() ?? { x: 0, width: baseItemSize }
    return val - rect.x - baseItemSize / 2
  })

  const targetSize = useTransform(mouseDistance, [-distance, 0, distance], [baseItemSize, magnification, baseItemSize])
  const size = useSpring(targetSize, spring)

  return (
    <motion.div
      ref={ref}
      style={{ width: size, height: size }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      className={`relative inline-flex items-center justify-center rounded-[1.65rem] shadow-md ${className}`}
      tabIndex={0}
      role="button"
    >
      {children}
    </motion.div>
  )
}

function ReactBitsDock({
  items,
  className = '',
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 102,
  distance = 180,
  baseItemSize = 88,
}: DockProps) {
  const mouseX = useMotionValue(Infinity)

  return (
    <div style={{ scrollbarWidth: 'none' }} className="mx-2 flex max-w-full items-center">
      <motion.div
        onMouseMove={({ pageX }) => {
          mouseX.set(pageX)
        }}
        onMouseLeave={() => {
          mouseX.set(Infinity)
        }}
        className={`${className} absolute bottom-2 left-1/2 flex w-fit -translate-x-1/2 transform items-end gap-3 rounded-[28px] px-4 pb-3 pt-2`}
        style={{ height: baseItemSize + 14 }}
        role="toolbar"
        aria-label="Review feedback dock"
      >
        {items.map((item) => (
          <DockItem
            key={item.rating}
            onClick={item.onClick}
            className={item.className}
            mouseX={mouseX}
            spring={spring}
            distance={distance}
            magnification={magnification}
            baseItemSize={baseItemSize}
          >
            <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 px-2 text-center">
              <div className="flex items-center justify-center">
                {item.icon}
              </div>
              <div className="text-[0.95rem] font-semibold leading-none">{item.label}</div>
              {item.interval && (
                <div className="text-[0.78rem] leading-none opacity-75">
                  {item.interval}
                </div>
              )}
            </div>
          </DockItem>
        ))}
      </motion.div>
    </div>
  )
}

const FEEDBACK_ITEMS = [
  {
    rating: 1 as const,
    label: 'Again',
    color: 'bg-red-50/90 text-red-600',
    icon: RotateCcw,
  },
  {
    rating: 2 as const,
    label: 'Hard',
    color: 'bg-orange-50/90 text-orange-500',
    icon: AlertTriangle,
  },
  {
    rating: 3 as const,
    label: 'Good',
    color: 'bg-emerald-50/90 text-emerald-600',
    icon: Check,
  },
  {
    rating: 4 as const,
    label: 'Easy',
    color: 'bg-blue-50/90 text-blue-600',
    icon: Sparkles,
  },
]

export function ReviewFeedbackDock({
  onRate,
  intervals,
  visible,
}: {
  onRate: (rating: Rating) => void
  intervals?: {
    again: string
    hard: string
    good: string
    easy: string
  }
  visible: boolean
}) {
  const items: DockItemData[] = FEEDBACK_ITEMS.map((item) => {
    const Icon = item.icon
    const intervalKey = item.label.toLowerCase() as 'again' | 'hard' | 'good' | 'easy'
    return {
      rating: item.rating,
      label: item.label,
      icon: <Icon className="size-5.5" />,
      onClick: () => onRate(item.rating),
      className: item.color,
      interval: intervals?.[intervalKey],
    }
  })

  return (
    <div className="relative z-20 flex min-h-[calc(env(safe-area-inset-bottom)+8.75rem)] items-end pb-[calc(env(safe-area-inset-bottom)+0.85rem)] pt-3">
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full"
          >
            <div className="mx-auto max-w-xl px-3">
              <ReactBitsDock
                items={items}
                className="bg-background/92 shadow-[0_-10px_35px_-26px_hsl(var(--foreground)/0.45)] backdrop-blur-xl"
                baseItemSize={90}
                magnification={102}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
