'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const links = [
  { href: '/', label: 'Главная' },
  { href: '/stats', label: 'Статистика' },
  { href: '/import', label: 'Импорт' },
]

export function Nav() {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="border-b">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <nav className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                pathname === link.href
                  ? 'bg-secondary text-secondary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Button variant="ghost" size="sm" onClick={signOut}>
          Выйти
        </Button>
      </div>
    </header>
  )
}
