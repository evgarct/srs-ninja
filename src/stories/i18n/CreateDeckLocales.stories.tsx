import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { within, userEvent } from 'storybook/test'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreateDeckDialog } from '@/components/create-deck-dialog'
import { withLocale, localeArgType, messagesByLocale } from './withLocale'
import type { Locale } from '@/i18n/config'

function CreateDeckDialogDemo() {
  const [open, setOpen] = useState(false)
  return <><Button onClick={() => setOpen(true)}>+ Trigger</Button><CreateDeckDialog open={open} onOpenChange={setOpen} /></>
}

function makePlay(locale: Locale): StoryObj<typeof meta>['play'] {
  return async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const t = messagesByLocale[locale]
    await userEvent.click(canvas.getByRole('button'))
    const body = within(document.body)
    await body.findByText(t.createDeck.title)
    await body.findByPlaceholderText(t.createDeck.namePlaceholder)
    await body.findByText(t.createDeck.language)
    await body.findByText(t.createDeck.translationLanguage)
    await body.findByRole('button', { name: t.createDeck.create })
  }
}

const meta = {
  title: 'i18n/Create Deck Dialog',
  component: CreateDeckDialogDemo,
  decorators: [withLocale],
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark', values: [{ name: 'dark', value: '#0a0a0a' }] },
    nextjs: {
      appDirectory: true,
      navigation: { pathname: '/' },
    },
  },
  argTypes: localeArgType,
  args: {
    locale: 'ru',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CreateDeckDialogDemo>

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
