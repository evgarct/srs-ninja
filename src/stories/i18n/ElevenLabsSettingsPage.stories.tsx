import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, within } from 'storybook/test'
import { useTranslations } from 'next-intl'

import { ElevenLabsSettingsView } from '@/components/elevenlabs-settings-view'
import type { Locale } from '@/i18n/config'
import { localeArgType, messagesByLocale, withLocale } from './withLocale'

type Props = {
  locale?: Locale
  state: 'disconnected' | 'connected' | 'connection-error' | 'owner'
}

const voices = [
  { voice_id: 'voice-1', name: 'Gökçe Deniz' },
  { voice_id: 'voice-2', name: 'Lily' },
]

function SettingsPageDemo({ state }: Props) {
  const t = useTranslations('elevenlabsSettings')
  const initial = state === 'owner'
    ? { isOwner: true, connected: true, tier: 'owner', voices: [], selections: {} }
    : state === 'connected' || state === 'connection-error'
      ? {
          isOwner: false,
          connected: true,
          tier: 'creator',
          voices,
          selections: { english: 'voice-2', turkish: 'voice-1' },
          connectionError: state === 'connection-error',
        }
      : { isOwner: false, connected: false, tier: null, voices: [], selections: {} }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 pb-28">
      <h1 className="mb-2 text-3xl font-semibold">{t('pageTitle')}</h1>
      <p className="mb-6 text-muted-foreground">{t('pageDescription')}</p>
      <ElevenLabsSettingsView initial={initial} actions={{
        connect: async () => ({ tier: 'storybook', voices }),
        saveVoices: async () => {},
        disconnect: async () => {},
      }} />
    </main>
  )
}

const meta = {
  title: 'Pages/ElevenLabs Settings',
  component: SettingsPageDemo,
  decorators: [withLocale],
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true, navigation: { pathname: '/settings/elevenlabs' } },
  },
  argTypes: {
    ...localeArgType,
    state: { control: 'radio', options: ['disconnected', 'connected', 'connection-error', 'owner'] },
  },
  args: { locale: 'en', state: 'disconnected' },
} satisfies Meta<typeof SettingsPageDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Disconnected: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText(messagesByLocale.en.elevenlabsSettings.apiKey)).toHaveAttribute('type', 'password')
    await expect(canvas.getByRole('button', { name: messagesByLocale.en.elevenlabsSettings.connect })).toBeDisabled()
  },
}

export const Connected: Story = { args: { state: 'connected' } }
export const ConnectionError: Story = {
  args: { state: 'connection-error' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toHaveTextContent(
      messagesByLocale.en.elevenlabsSettings.connectionUnavailable
    )
    await expect(canvas.getByRole('button', {
      name: messagesByLocale.en.elevenlabsSettings.disconnect,
    })).toBeEnabled()
  },
}
export const Owner: Story = { args: { state: 'owner' } }

export const TurkishMobile: Story = {
  args: { locale: 'tr', state: 'connected' },
  parameters: { viewport: { defaultViewport: 'mobile1' }, a11y: { test: 'error' } },
}
