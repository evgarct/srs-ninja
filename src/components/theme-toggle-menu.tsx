'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'

import { DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu'

const THEME_OPTIONS = [
  { value: 'light', icon: Sun, key: 'themeLight' },
  { value: 'dark', icon: Moon, key: 'themeDark' },
  { value: 'system', icon: Monitor, key: 'themeSystem' },
] as const

export function ThemeMenuItems() {
  const t = useTranslations('nav')
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
      {THEME_OPTIONS.map(({ value, icon: Icon, key }) => (
        <DropdownMenuRadioItem key={value} value={value}>
          <Icon className="size-4" />
          {t(key)}
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  )
}
