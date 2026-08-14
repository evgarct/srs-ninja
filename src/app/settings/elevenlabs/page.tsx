import { getTranslations } from 'next-intl/server'
import { ElevenLabsSettings } from '@/components/elevenlabs-settings'
import { getElevenLabsSettings } from '@/lib/actions/elevenlabs'

export default async function ElevenLabsSettingsPage() {
  const [t, initial] = await Promise.all([getTranslations('elevenlabsSettings'), getElevenLabsSettings()])
  return <main className="mx-auto w-full max-w-2xl px-4 py-10 pb-28"><h1 className="mb-2 text-3xl font-semibold">{t('pageTitle')}</h1><p className="mb-6 text-muted-foreground">{t('pageDescription')}</p><ElevenLabsSettings initial={initial} /></main>
}
