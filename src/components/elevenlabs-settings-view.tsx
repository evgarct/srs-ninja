'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, ExternalLink, KeyRound, Languages, ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import {
  ELEVENLABS_LANGUAGES,
  type ElevenLabsLanguage,
  type ElevenLabsVoice,
  type ElevenLabsVoiceSelections,
} from '@/lib/elevenlabs-types'

export type ElevenLabsSettingsState = {
  connected: boolean
  connectionError?: boolean
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
  const [connectionError, setConnectionError] = useState(initial.connectionError ?? false)
  const [tier, setTier] = useState(initial.tier)
  const [voices, setVoices] = useState(initial.voices)
  const [selections, setSelections] = useState(initial.selections)
  const [pending, startTransition] = useTransition()

  function connect() {
    startTransition(async () => {
      try {
        const result = await actions.connect(apiKey)
        setConnected(true)
        setConnectionError(false)
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
        setConnectionError(false)
        setTier(null)
        setVoices([])
        setSelections({})
        toast.success(t('disconnected'))
      } catch {
        toast.error(t('disconnectError'))
      }
    })
  }

  const selectedCount = ELEVENLABS_LANGUAGES.filter((language) => selections[language]?.trim()).length

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('setupTitle')}</CardTitle>
          <CardDescription>{t('setupDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-4 md:grid-cols-3">
            {([
              ['stepKeyTitle', 'stepKeyDescription', KeyRound],
              ['stepConnectTitle', 'stepConnectDescription', ShieldCheck],
              ['stepVoicesTitle', 'stepVoicesDescription', Languages],
            ] as const).map(([title, description, Icon], index) => (
              <li key={title} className="flex gap-3 rounded-xl border p-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="flex items-center gap-2 font-medium"><Icon className="size-4" aria-hidden="true" />{t(title)}</p>
                  <p className="text-sm text-muted-foreground">{t(description)}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {!connected ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="elevenlabs-key">{t('apiKey')}</Label>
              <Input
                id="elevenlabs-key"
                type="password"
                autoComplete="off"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder={t('apiKeyPlaceholder')}
              />
              <p className="text-sm text-muted-foreground">{t('keyHint')}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button disabled={pending || !apiKey.trim()} onClick={connect}>
                {pending ? <Spinner data-icon="inline-start" /> : null}
                {t('connect')}
              </Button>
              <Button variant="outline" render={<a href="https://elevenlabs.io/app/settings/api-keys" target="_blank" rel="noreferrer" />}>
                {t('openApiKeys')}<ExternalLink data-icon="inline-end" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>{t('voicesTitle')}</CardTitle>
                <Badge variant={connectionError ? 'outline' : 'secondary'}>
                  {connectionError ? t('connectionProblem') : t('connectedTier', { tier: tier ?? 'unknown' })}
                </Badge>
              </div>
              <CardDescription>{t('voicesDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {connectionError ? (
                <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                  {t('connectionUnavailable')}
                </div>
              ) : null}
              {!connectionError && voices.length === 0 ? (
                <div role="status" className="rounded-xl border p-4 text-sm text-muted-foreground">{t('noVoices')}</div>
              ) : null}
              <div className="grid gap-4 lg:grid-cols-3">
                {ELEVENLABS_LANGUAGES.map((language) => (
                  <VoiceField
                    key={language}
                    language={language}
                    voices={voices}
                    value={selections[language] ?? ''}
                    disabled={connectionError}
                    onChange={(value) => setSelections((current) => ({ ...current, [language]: value }))}
                  />
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  {t('selectedCount', { selected: selectedCount, total: ELEVENLABS_LANGUAGES.length })}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button disabled={pending || connectionError || voices.length === 0} onClick={saveVoices}>
                    {pending ? <Spinner data-icon="inline-start" /> : null}
                    {t('saveVoices')}
                  </Button>
                  <Button disabled={pending} variant="outline" onClick={disconnect}>{t('disconnect')}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <p className="text-sm text-muted-foreground">{t('voiceIdValidation')}</p>
        </>
      )}
    </div>
  )
}

function VoiceField({ language, voices, value, disabled, onChange }: {
  language: ElevenLabsLanguage
  voices: ElevenLabsVoice[]
  value: string
  disabled: boolean
  onChange(value: string): void
}) {
  const t = useTranslations('elevenlabsSettings')
  const selectedVoice = voices.find((voice) => voice.voice_id === value)
  const listId = `${language}-voice-options`

  return (
    <div className="flex flex-col gap-2 rounded-xl border p-4">
      <Label htmlFor={`${language}-voice`}>{t(`${language}Voice`)}</Label>
      <Input
        id={`${language}-voice`}
        list={listId}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value.trim())}
        placeholder={t('voiceIdPlaceholder')}
        className="font-mono text-xs"
      />
      <datalist id={listId}>
        {voices.map((voice) => <option key={voice.voice_id} value={voice.voice_id}>{voice.name}</option>)}
      </datalist>
      <p className="min-h-10 text-xs text-muted-foreground">
        {selectedVoice
          ? t('selectedVoice', { name: selectedVoice.name, category: selectedVoice.category ?? t('unknownCategory') })
          : value ? t('unknownVoiceId') : t('voiceFieldHint')}
      </p>
    </div>
  )
}
