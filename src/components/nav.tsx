'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { BarChart3, Bot, Check, Ellipsis, House, LogOut, Plus, Settings, Upload } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { useTheme } from 'next-themes'

import { BrandLogo } from '@/components/brand/brand-logo'
import { CreateDeckDialog } from '@/components/create-deck-dialog'
import { ThemeMenuItems } from '@/components/theme-toggle-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { buttonVariants } from '@/lib/button-variants'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { setLocale } from '@/lib/actions/locale'
import type { Locale } from '@/i18n/config'
import { useState } from 'react'

const LANGUAGE_OPTIONS: { locale: Locale; label: string }[] = [
  { locale: 'en', label: '🇬🇧 English' },
  { locale: 'ru', label: '🇷🇺 Русский' },
  { locale: 'cs', label: '🇨🇿 Čeština' },
  { locale: 'tr', label: '🇹🇷 Türkçe' },
]

export function Nav() {
  const [createDeckOpen, setCreateDeckOpen] = useState(false)
  const shouldReduceMotion = useReducedMotion() ?? false
  const navPillTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 400, damping: 32 }
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const isReviewRoute = pathname.startsWith('/review/') || /^\/decks\/[^/]+\/review$/.test(pathname)

  // `resolvedTheme` is undefined until after hydration (next-themes limitation);
  // defaults to the "inverse" (dark-bg) logo tone, matching the app's
  // defaultTheme, until the ThemeProvider resolves and re-renders.
  const logoTone = resolvedTheme === 'light' ? 'default' : 'inverse'

  const links = [
    { href: '/', label: t('decks'), icon: House },
    { href: '/stats', label: t('stats'), icon: BarChart3 },
  ]

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function handleLocaleChange(newLocale: Locale) {
    await setLocale(newLocale)
    router.refresh()
  }

  if (isReviewRoute) return null

  const overflowMenu = (
    <>
      <DropdownMenuGroup>
        <DropdownMenuItem onClick={() => setCreateDeckOpen(true)}>
          <Plus className="size-4" />
          {t('newDeck')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/import')}>
          <Upload className="size-4" />
          {t('import')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/mcp')}>
          <Bot className="size-4" />
          {t('mcpGuide')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/settings/elevenlabs')}>
          <Settings className="size-4" />
          {t('voiceSettings')}
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        {LANGUAGE_OPTIONS.map(({ locale: loc, label }) => (
          <DropdownMenuItem key={loc} onClick={() => handleLocaleChange(loc)}>
            {locale === loc ? <Check className="size-4" /> : <span className="size-4" />}
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <ThemeMenuItems />
      <DropdownMenuSeparator />
      <DropdownMenuItem variant="destructive" onClick={signOut}>
        <LogOut className="size-4" />
        {t('logout')}
      </DropdownMenuItem>
    </>
  )

  return (
    <>
      <CreateDeckDialog open={createDeckOpen} onOpenChange={setCreateDeckOpen} />
      <header className="hidden px-4 pt-3 sm:px-5 sm:pt-4 md:block">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-full border border-border bg-background/70 px-3 py-2.5 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Link href="/" prefetch className="inline-flex shrink-0 items-center gap-2">
              <BrandLogo
                tone={logoTone}
                iconClassName="size-7"
                labelClassName="hidden text-base text-foreground sm:inline-flex"
              />
            </Link>

            <nav className="hidden items-center gap-1 sm:flex">
              {links.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch
                    className={cn(
                      'relative inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                      isActive ? 'text-accent-foreground' : 'text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground'
                    )}
                  >
                    {isActive ? (
                      <motion.span
                        layoutId="nav-active-pill-desktop"
                        className="absolute inset-0 rounded-full bg-accent shadow-[inset_0_0_0_1px_rgba(127,127,127,0.12)]"
                        transition={navPillTransition}
                      />
                    ) : null}
                    <link.icon className="relative size-4" />
                    <span className="relative">{link.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  aria-label={t('openMenu')}
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
                    'rounded-full border border-border bg-foreground/[0.04] text-foreground hover:bg-foreground/[0.08] hover:text-foreground'
                  )}
                >
                  <Ellipsis className="size-4" />
                </button>
              }
            />
            <DropdownMenuContent align="end" className="w-56">
              {overflowMenu}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex justify-center px-4 md:hidden">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-background/85 p-2 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
          {links.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch
                className={cn(
                  'relative inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground'
                )}
              >
                {isActive ? (
                  <motion.span
                    layoutId="nav-active-pill-mobile"
                    className="absolute inset-0 rounded-full bg-primary"
                    transition={navPillTransition}
                  />
                ) : null}
                <link.icon className="relative size-4" />
                <span className="relative">{link.label}</span>
              </Link>
            )
          })}

          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full bg-foreground/[0.06] text-foreground transition hover:bg-foreground/[0.1]"
            aria-label={t('newDeckAriaLabel')}
            onClick={() => setCreateDeckOpen(true)}
          >
            <Plus className="size-4" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  aria-label={t('openMenu')}
                  className="inline-flex size-10 items-center justify-center rounded-full bg-foreground/[0.06] text-foreground transition hover:bg-foreground/[0.1]"
                >
                  <Ellipsis className="size-4" />
                </button>
              }
            />
            <DropdownMenuContent align="end" side="top" className="w-56">
              {overflowMenu}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  )
}
