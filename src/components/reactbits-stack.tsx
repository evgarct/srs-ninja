import { motion, useMotionValue, useTransform, type PanInfo } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'

interface CardRotateProps {
  children: React.ReactNode
  onSendToBack: () => void
  sensitivity: number
  disableDrag?: boolean
}

function CardRotate({ children, onSendToBack, sensitivity, disableDrag = false }: CardRotateProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useTransform(y, [-100, 100], [60, -60])
  const rotateY = useTransform(x, [-100, 100], [-60, 60])

  function handleDragEnd(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (Math.abs(info.offset.x) > sensitivity || Math.abs(info.offset.y) > sensitivity) {
      onSendToBack()
    } else {
      x.set(0)
      y.set(0)
    }
  }

  if (disableDrag) {
    return (
      <motion.div className="absolute inset-0 cursor-pointer" style={{ x: 0, y: 0 }}>
        {children}
      </motion.div>
    )
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-grab"
      style={{ x, y, rotateX, rotateY }}
      drag
      dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
      dragElastic={0.6}
      whileTap={{ cursor: 'grabbing' }}
      onDragEnd={handleDragEnd}
    >
      {children}
    </motion.div>
  )
}

interface ReactBitsStackProps {
  randomRotation?: boolean
  sensitivity?: number
  sendToBackOnClick?: boolean
  cards?: React.ReactNode[]
  animationConfig?: { stiffness: number; damping: number }
  pauseOnHover?: boolean
  mobileClickOnly?: boolean
  mobileBreakpoint?: number
}

export function ReactBitsStack({
  randomRotation = false,
  sensitivity = 200,
  cards = [],
  animationConfig = { stiffness: 260, damping: 20 },
  sendToBackOnClick = false,
  pauseOnHover = false,
  mobileClickOnly = false,
  mobileBreakpoint = 768,
}: ReactBitsStackProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [mobileBreakpoint])

  const shouldDisableDrag = mobileClickOnly && isMobile
  const shouldEnableClick = sendToBackOnClick || shouldDisableDrag

  const stack = useMemo(
    () => cards.map((content, index) => ({ id: index + 1, content })),
    [cards]
  )

  return (
    <div
      className="relative h-full w-full"
      style={{ perspective: 600 }}
      onMouseEnter={() => pauseOnHover}
      onMouseLeave={() => pauseOnHover}
    >
      {stack.map((card, index) => {
        const randomRotate = randomRotation ? ((card.id * 7) % 10) - 5 : 0
        return (
          <CardRotate
            key={card.id}
            onSendToBack={() => {}}
            sensitivity={sensitivity}
            disableDrag={shouldDisableDrag}
          >
            <motion.div
              className="h-full w-full overflow-hidden rounded-2xl"
              onClick={() => shouldEnableClick}
              animate={{
                rotateZ: (stack.length - index - 1) * 4 + randomRotate,
                scale: 1 + index * 0.06 - stack.length * 0.06,
                transformOrigin: '90% 90%',
              }}
              initial={false}
              transition={{
                type: 'spring',
                stiffness: animationConfig.stiffness,
                damping: animationConfig.damping,
              }}
            >
              {card.content}
            </motion.div>
          </CardRotate>
        )
      })}
    </div>
  )
}
