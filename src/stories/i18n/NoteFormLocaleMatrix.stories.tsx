import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, within } from 'storybook/test'

import { NoteForm } from '@/components/note-form'
import type { Locale } from '@/i18n/config'
import type { Language } from '@/lib/types'
import { localeArgType, withLocale } from './withLocale'

type Props = { locale?: Locale; language: Language }

function NoteFormPage({ language }: Props) {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-xl">
        <NoteForm deckId="storybook-deck" language={language} />
      </div>
    </main>
  )
}

const meta = {
  title: 'Pages/Note Form Locale Matrix',
  component: NoteFormPage,
  decorators: [withLocale],
  parameters: { layout: 'fullscreen', nextjs: { appDirectory: true } },
  argTypes: {
    ...localeArgType,
    language: { control: 'radio', options: ['english', 'czech', 'turkish'] },
  },
  args: { locale: 'ru', language: 'turkish' },
} satisfies Meta<typeof NoteFormPage>

export default meta
type Story = StoryObj<typeof meta>

export const RussianUiTurkishDeck: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText(/Слово \/ фраза/)).toBeVisible()
    await expect(canvas.getByLabelText(/Модель употребления/)).toBeVisible()
    await expect(canvas.queryByText('Kullanım kalıbı')).not.toBeInTheDocument()
  },
}

export const EnglishUiCzechDeck: Story = { args: { locale: 'en', language: 'czech' } }
export const CzechUiEnglishDeck: Story = { args: { locale: 'cs', language: 'english' } }
export const TurkishUiEnglishDeck: Story = { args: { locale: 'tr', language: 'english' } }
