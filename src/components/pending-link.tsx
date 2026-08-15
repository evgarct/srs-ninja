'use client'

import Link, { type LinkProps } from 'next/link'
import type { AnchorHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils'

type PendingLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children: ReactNode
    pendingLabel: string
  }

export function PendingLink({ children, className, pendingLabel: _pendingLabel, ...props }: PendingLinkProps) {
  void _pendingLabel
  return (
    <Link
      className={cn('relative', className)}
      aria-label={props['aria-label']}
      prefetch={props.prefetch ?? true}
      {...props}
    >
      {children}
    </Link>
  )
}
