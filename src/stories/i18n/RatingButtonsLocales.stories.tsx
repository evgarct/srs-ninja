import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { within, fn } from 'storybook/test'
import { RatingButtons } from '@/components/flashcard/RatingButtons'
import { withLocale, localeArgType, messagesByLocale } from './withLocale'
import type { Locale } from '@/i18n/config'

function makePlay(locale: Locale): StoryObj<typeof meta>['play'] {
  return async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const t = messagesByLocale[locale]
    await canvas.findByRole('button', { name: new RegExp(t.review.ratingAgain) })
    await canvas.findByRole('button', { name: new RegExp(t.review.ratingHard) })
    await canvas.findByRole('button', { name: new RegExp(t.review.ratingGood) })
    await canvas.findByRole('button', { name: new RegExp(t.review.ratingEasy) })
  }
}

const meta = {
  title: 'i18n/Rating Buttons',
  component: RatingButtons,
  decorators: [withLocale],
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#090511' },
        { name: 'light', value: '#f8f8f8' },
      ],
    },
  },
  argTypes: {
    ...localeArgType,
    visualStyle: {
      control: 'radio',
      options: ['default', 'floating'],
    },
  },
  args: {
    locale: 'ru',
    onRate: fn(),
    intervals: { again: '10m', hard: '1d', good: '3d', easy: '7d' },
    visualStyle: 'default',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RatingButtons>

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
