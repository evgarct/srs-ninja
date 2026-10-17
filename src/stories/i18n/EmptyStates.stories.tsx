import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { within } from 'storybook/test'
import { useTranslations } from 'next-intl'
import { Library } from 'lucide-react'
import { withLocale, localeArgType, messagesByLocale } from './withLocale'
import type { Locale } from '@/i18n/config'

function HomeEmptyState({ locale }: { locale?: Locale }) {
  const t = useTranslations('home')
  return (
    <div data-locale={locale} className="flex items-center justify-center min-h-[200px] bg-background p-8 rounded-xl">
      <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.03] px-6 py-16 text-center text-muted-foreground">
        <Library className="size-8 text-muted-foreground/70" aria-hidden />
        <p className="text-lg text-foreground">{t('noDecks')}</p>
      </div>
    </div>
  )
}

function makePlay(locale: Locale): StoryObj<typeof meta>['play'] {
  return async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const t = messagesByLocale[locale]
    await canvas.findByText(t.home.noDecks)
  }
}

const meta = {
  title: 'i18n/Empty States',
  component: HomeEmptyState,
  decorators: [withLocale],
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark', values: [{ name: 'dark', value: '#0a0a0a' }] },
  },
  argTypes: localeArgType,
  args: { locale: 'ru' },
  tags: ['autodocs'],
} satisfies Meta<typeof HomeEmptyState>

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

export const LocaleTr: Story = {
  args: { locale: 'tr' },
  play: makePlay('tr'),
  tags: ['!dev'],
  parameters: { a11y: { test: 'error' } },
}
