'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ELEVENLABS_LANGUAGES, type ElevenLabsVoice, type ElevenLabsVoiceSelections } from '@/lib/elevenlabs-types'

export type ElevenLabsSettingsState = {
  isOwner: boolean
  connected: boolean
  tier: string | null
  voices: ElevenLabsVoice[]
  selections: ElevenLabsVoiceSelections
}

type Props = {
  initial: ElevenLabsSettingsState
  actions: {
    connect(apiKey: string): Promise<{ tier: string; voices: ElevenLabsVoice[] }>
    saveVoices(selections: ElevenLabsVoiceSelections): Promise<void>
    disconnect(): Promise<void>
  }
}

export function ElevenLabsSettingsView({ initial, actions }: Props) {
  const t = useTranslations('elevenlabsSettings')
  const [apiKey, setApiKey] = useState('')
  const [connected, setConnected] = useState(initial.connected)
  const [tier, setTier] = useState(initial.tier)
  const [voices, setVoices] = useState(initial.voices)
  const [selections, setSelections] = useState(initial.selections)
  const [pending, startTransition] = useTransition()

  function connect() {
    startTransition(async () => {
      try {
        const result = await actions.connect(apiKey)
        setConnected(true)
        setTier(result.tier)
        setVoices(result.voices)
        setApiKey('')
        toast.success(t('connected'))
      } catch {
        toast.error(t('connectError'))
      }
    })
  }

  function saveVoices() {
    startTransition(async () => {
      try {
        await actions.saveVoices(selections)
        toast.success(t('voicesSaved'))
      } catch {
        toast.error(t('saveError'))
      }
    })
  }

  function disconnect() {
    startTransition(async () => {
      try {
        await actions.disconnect()
        setConnected(false)
        setVoices([])
        setSelections({})
        toast.success(t('disconnected'))
      } catch {
        toast.error(t('disconnectError'))
      }
    })
  }

  if (initial.isOwner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('ownerTitle')}</CardTitle>
          <CardDescription>{t('ownerDescription')}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!connected ? (
          <div className="space-y-3">
            <Label htmlFor="elevenlabs-key">{t('apiKey')}</Label>
            <Input id="elevenlabs-key" type="password" autoComplete="off" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={t('apiKeyPlaceholder')} />
            <p className="text-sm text-muted-foreground">{t('keyHint')}</p>
            <Button disabled={pending || !apiKey.trim()} onClick={connect}>{t('connect')}</Button>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">{t('connectedTier', { tier: tier ?? 'unknown' })}</p>
            {ELEVENLABS_LANGUAGES.map((language) => (
              <div className="space-y-2" key={language}>
                <Label htmlFor={`${language}-voice`}>{t(`${language}Voice`)}</Label>
                <Select value={selections[language] ?? ''} onValueChange={(value) => setSelections((current) => ({ ...current, [language]: value }))} items={voices.map((voice) => ({ value: voice.voice_id, label: voice.name }))}>
                  <SelectTrigger id={`${language}-voice`}><SelectValue placeholder={t('chooseVoice')} /></SelectTrigger>
                  <SelectContent>{voices.map((voice) => <SelectItem key={voice.voice_id} value={voice.voice_id}>{voice.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ))}
            <div className="flex flex-wrap gap-3">
              <Button disabled={pending} onClick={saveVoices}>{t('saveVoices')}</Button>
              <Button disabled={pending} variant="outline" onClick={disconnect}>{t('disconnect')}</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
