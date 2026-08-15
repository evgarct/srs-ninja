'use client'

import Link, { useLinkStatus, type LinkProps } from 'next/link'
import type { AnchorHTMLAttributes, ReactNode } from 'react'

import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

type PendingLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children: ReactNode
    pendingLabel: string
  }

function PendingContent({ children, pendingLabel }: { children: ReactNode; pendingLabel: string }) {
  const { pending } = useLinkStatus()

  return (
    <>
      <span className={cn('contents', pending && 'opacity-60')} aria-hidden={pending || undefined}>
        {children}
      </span>
      {pending ? <Spinner aria-label={pendingLabel} data-icon="inline-end" /> : null}
    </>
  )
}

export function PendingLink({ children, className, pendingLabel, ...props }: PendingLinkProps) {
  return (
    <Link
      className={cn('relative', className)}
      aria-label={props['aria-label']}
      prefetch={props.prefetch ?? true}
      {...props}
    >
      <PendingContent pendingLabel={pendingLabel}>{children}</PendingContent>
    </Link>
  )
}
