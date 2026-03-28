import { brand } from '@/lib/brand'
import { cn } from '@/lib/utils'

interface BrandMarkProps {
  className?: string
  tone?: 'default' | 'inverse'
}

export function BrandMark({ className, tone = 'default' }: BrandMarkProps) {
  const stroke = tone === 'inverse' ? brand.logo.darkStroke : brand.logo.lightStroke
  const fill = tone === 'inverse' ? brand.logo.darkFill : brand.logo.lightFill

  return (
    <svg
      viewBox="0 0 96 96"
      aria-hidden="true"
      className={cn('size-8 shrink-0', className)}
      fill="none"
    >
      <rect x="46" y="18" width="31" height="31" rx="5" fill={stroke} />
      <rect x="35" y="24" width="31" height="31" rx="5" fill={stroke} />
      <g transform="rotate(-3 39 49)">
        <rect x="18" y="34" width="41" height="28" rx="5" fill={fill} stroke={stroke} strokeWidth="4.5" />
        <line x1="26" y1="55.5" x2="48" y2="55.5" stroke={stroke} strokeWidth="4.5" strokeLinecap="round" />
      </g>
      {tone === 'inverse' ? (
        <g stroke={stroke} strokeWidth="1.5" opacity="0.12">
          <rect x="46" y="18" width="31" height="31" rx="5" />
          <rect x="35" y="24" width="31" height="31" rx="5" />
        </g>
      ) : null}
    </svg>
  )
}

interface BrandLogoProps {
  className?: string
  iconClassName?: string
  labelClassName?: string
  showWordmark?: boolean
  tone?: 'default' | 'inverse'
}

export function BrandLogo({
  className,
  iconClassName,
  labelClassName,
  showWordmark = true,
  tone = 'default',
}: BrandLogoProps) {
  const color = tone === 'inverse' ? brand.logo.darkStroke : brand.logo.lightStroke

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <BrandMark className={iconClassName} tone={tone} />
      {showWordmark ? (
        <span className={cn('text-lg font-semibold tracking-[-0.03em]', labelClassName)} style={{ color }}>
          {brand.name}
        </span>
      ) : null}
    </span>
  )
}
