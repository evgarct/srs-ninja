'use client'

import { Spinner } from '@/components/ui/spinner'
import { useTranslations } from 'next-intl'

export default function AppLoading() {
  const t = useTranslations('nav')

  return (
    <main className="flex min-h-[50vh] items-center justify-center px-4" aria-live="polite">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Spinner />
        <span>{t('loading')}</span>
      </div>
    </main>
  )
}
