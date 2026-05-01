import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { within } from 'storybook/test'
import { useTranslations } from 'next-intl'
import { withLocale, localeArgType, messagesByLocale } from './withLocale'
import type { Locale } from '@/i18n/config'

function HomeEmptyState(_: { locale?: Locale }) {
  const t = useTranslations('home')
  return (
    <div className="dark flex items-center justify-center min-h-[200px] bg-[#0a0a0a] p-8 rounded-xl">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-16 text-center text-white/72">
        <p className="mb-2 text-lg text-white">{t('noDecks')}</p>
        <p className="text-sm">{t('createFirst')}</p>
      </div>
    </div>
  )
}

function makePlay(locale: Locale): StoryObj<typeof meta>['play'] {
  return async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const t = messagesByLocale[locale]
    await canvas.findByText(t.home.noDecks)
    await canvas.findByText(t.home.createFirst)
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
