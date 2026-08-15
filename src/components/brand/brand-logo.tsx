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
      <g stroke={stroke} strokeWidth="7" strokeLinejoin="round">
        <rect x="31" y="15" width="46" height="50" rx="12" opacity="0.28" />
        <rect x="23" y="23" width="50" height="52" rx="12" opacity="0.55" />
        <rect x="15" y="31" width="54" height="50" rx="12" fill={fill} />
      </g>
      <path d="M67 40c8 7 8 21 0 28M75 32c14 12 14 32 0 44" stroke={tone === 'inverse' ? '#a78bfa' : '#7c3aed'} strokeWidth="5" strokeLinecap="round" />
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
