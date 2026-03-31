'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BarChart3, Ellipsis, House, LogOut, Plus, Upload } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { buttonVariants } from '@/lib/button-variants'
import { cn } from '@/lib/utils'
import { BrandLogo } from '@/components/brand/brand-logo'
import { CreateDeckDialog } from '@/components/create-deck-dialog'

const links = [
  { href: '/', label: 'Колоды', icon: House },
  { href: '/stats', label: 'Статистика', icon: BarChart3 },
]

export function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const isReviewRoute = pathname.startsWith('/review/') || /^\/decks\/[^/]+\/review$/.test(pathname)

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      <header className={cn('px-4 pt-3 sm:px-5 sm:pt-4', isReviewRoute && 'hidden md:block')}>
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-full border border-white/10 bg-black/45 px-3 py-2.5 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.85)] backdrop-blur-xl">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Link href="/" className="shrink-0">
              <BrandLogo
                tone="inverse"
                iconClassName="size-7"
                labelClassName="hidden text-base text-white sm:inline-flex"
              />
            </Link>

            <nav className="hidden items-center gap-1 sm:flex">
              {links.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-white/[0.12] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
                        : 'text-white/58 hover:bg-white/[0.06] hover:text-white'
                    )}
                  >
                    <link.icon className="size-4" />
                    {link.label}
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
                  aria-label="Открыть дополнительные действия"
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
                    'rounded-full border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1] hover:text-white'
                  )}
                >
                  <Ellipsis className="size-4" />
                </button>
              }
            />
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <CreateDeckDialog
                  trigger={
                    <DropdownMenuItem>
                      <Plus className="size-4" />
                      Новая колода
                    </DropdownMenuItem>
                  }
                />
                <DropdownMenuItem onClick={() => router.push('/import')}>
                  <Upload className="size-4" />
                  Импорт
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={signOut}>
                <LogOut className="size-4" />
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {!isReviewRoute ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex justify-center px-4 md:hidden">
          <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/10 bg-black/72 p-2 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.92)] backdrop-blur-2xl">
            {links.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
                  )}
                >
                  <link.icon className="size-4" />
                  <span>{link.label}</span>
                </Link>
              )
            })}

            <CreateDeckDialog
              trigger={
                <button
                  type="button"
                  className="inline-flex size-10 items-center justify-center rounded-full bg-white/[0.08] text-white transition hover:bg-white/[0.12]"
                  aria-label="Создать новую колоду"
                >
                  <Plus className="size-4" />
                </button>
              }
            />
          </div>
        </div>
      ) : null}
    </>
  )
}
