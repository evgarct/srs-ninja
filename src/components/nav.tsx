'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BarChart3, Ellipsis, House, LogOut, Upload } from 'lucide-react'

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

const links = [
  { href: '/', label: 'Главная', icon: House },
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
    <header className={cn('border-b', isReviewRoute && 'hidden md:block')}>
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
        <nav className="flex items-center gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'inline-flex items-center gap-2 py-1 text-sm font-medium transition-colors',
                pathname === link.href
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label="Открыть дополнительные действия"
                className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
              >
                <Ellipsis className="size-4" />
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuGroup>
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
  )
}
