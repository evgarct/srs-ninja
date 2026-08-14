'use client'
import { Bot, CircleAlert, ExternalLink, ShieldCheck } from 'lucide-react'
import { CopyButton } from '@/components/copy-button'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { McpConnectionConfig } from '@/lib/mcp-connection'
import { useTranslations } from 'next-intl'

const STARTER_PROMPT = 'Connect to Echo, call get_echo_guide, then add words to my Turkish deck as drafts.'
export function McpConnectPanel({ appOrigin, endpointUrl, healthUrl, oauthReady, missingEnv, requiresPublicOrigin, legacyEnabled }: McpConnectionConfig) {
  const t = useTranslations('mcpConnect')
  return <Card><CardHeader><div className="flex flex-wrap items-center gap-2"><Bot aria-hidden="true" /><CardTitle>{t('title')}</CardTitle><Badge variant={oauthReady ? 'secondary' : 'outline'}>{oauthReady ? t('ready') : t('setup')}</Badge></div><CardDescription>{t('description')}</CardDescription></CardHeader><CardContent className="flex flex-col gap-5">
    {requiresPublicOrigin && <div className="rounded-xl border p-4 text-sm"><p className="flex items-center gap-2 font-medium"><CircleAlert aria-hidden="true" />{t('publicRequired')}</p><p className="mt-2 text-muted-foreground">{t('publicDescription', { origin: appOrigin ?? t('notConfigured') })}</p></div>}
    {!oauthReady && <div className="rounded-xl border p-4 text-sm"><p className="font-medium">{t('oauthMissing')}</p><p className="mt-2 text-muted-foreground">{t('missingConfig', { values: missingEnv.join(', ') })}</p></div>}
    {endpointUrl && <div className="flex flex-col gap-2"><p className="text-sm font-medium">{t('endpoint')}</p><div className="flex flex-col gap-2 sm:flex-row"><Input value={endpointUrl} readOnly className="font-mono text-xs" aria-label={t('endpoint')} /><CopyButton value={endpointUrl} label={t('endpointCopied')} /></div><p className="text-xs text-muted-foreground">{t('endpointHint')}</p></div>}
    <div className="grid gap-4 md:grid-cols-2"><div className="rounded-xl border p-4"><p className="font-medium">{t('permissions')}</p><ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground"><li>{t('permissionRead')}</li><li>{t('permissionCreate')}</li><li>{t('permissionDenied')}</li></ul></div><div className="rounded-xl border p-4"><p className="font-medium">{t('starter')}</p><p className="mt-3 text-sm text-muted-foreground">{STARTER_PROMPT}</p><CopyButton value={STARTER_PROMPT} label={t('promptCopied')} className="mt-3" /></div></div>
    {legacyEnabled && <p className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck aria-hidden="true" />{t('legacy')}</p>}
    <div className="flex flex-wrap gap-2"><a href="https://chatgpt.com/" target="_blank" rel="noreferrer" className={buttonVariants()}>{t('openChatgpt')}<ExternalLink data-icon="inline-end" /></a>{healthUrl && <a href={healthUrl} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'outline' })}>{t('testHealth')}<ExternalLink data-icon="inline-end" /></a>}</div>
  </CardContent></Card>
}
