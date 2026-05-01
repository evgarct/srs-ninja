import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { within, userEvent } from 'storybook/test'
import { useTranslations, useLocale } from 'next-intl'
import { Check, Globe, LogOut } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { withLocale, localeArgType, messagesByLocale } from './withLocale'
import type { Locale } from '@/i18n/config'

const LANGUAGE_OPTIONS: { locale: Locale; label: string }[] = [
  { locale: 'en', label: '🇬🇧 English' },
  { locale: 'ru', label: '🇷🇺 Русский' },
  { locale: 'cs', label: '🇨🇿 Čeština' },
]

function LanguageSwitcherDemo({ locale: activeLoc }: { locale?: Locale }) {
  const t = useTranslations('nav')
  const locale = useLocale() as Locale

  return (
    <div className="dark flex items-center justify-center min-h-[200px] bg-black/90 rounded-xl p-8">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-3 py-2 text-sm text-white hover:bg-white/[0.12] transition"
            >
              <Globe className="size-4" />
              {t('language')}
            </button>
          }
        />
        <DropdownMenuContent align="center" className="w-48">
          <DropdownMenuGroup>
            {LANGUAGE_OPTIONS.map(({ locale: loc, label }) => (
              <DropdownMenuItem key={loc}>
                {locale === loc ? <Check className="size-4 text-primary" /> : <span className="size-4" />}
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            <LogOut className="size-4" />
            {t('logout')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function makePlay(locale: Locale): StoryObj<typeof meta>['play'] {
  return async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const t = messagesByLocale[locale]
    // Open the dropdown
    const trigger = await canvas.findByRole('button')
    await userEvent.click(trigger)
    // Menu renders in a portal
    const body = within(document.body)
    // All three language options are present
    await body.findByText('🇬🇧 English')
    await body.findByText('🇷🇺 Русский')
    await body.findByText('🇨🇿 Čeština')
    // Logout is translated
    await body.findByText(t.nav.logout)
  }
}

const meta = {
  title: 'i18n/Language Switcher',
  component: LanguageSwitcherDemo,
  decorators: [withLocale],
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark', values: [{ name: 'dark', value: '#0a0a0a' }] },
  },
  argTypes: localeArgType,
  args: { locale: 'ru' },
  tags: ['autodocs'],
} satisfies Meta<typeof LanguageSwitcherDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: makePlay('ru'),
}

export const LocaleRu: Story = {
  args: { locale: 'ru' },
  play: makePlay('ru'),
  tags: ['!dev'],
  parameters: { a11y: { test: 'error' } },
}

export const LocaleEn: Story = {
  args: { locale: 'en' },
  play: makePlay('en'),
  tags: ['!dev'],
  parameters: { a11y: { test: 'error' } },
}

export const LocaleCs: Story = {
  args: { locale: 'cs' },
  play: makePlay('cs'),
  tags: ['!dev'],
  parameters: { a11y: { test: 'error' } },
}
