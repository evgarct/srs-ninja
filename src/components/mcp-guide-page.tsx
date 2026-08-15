'use client'

import { Bot, CircleAlert, ExternalLink, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { CopyButton } from '@/components/copy-button'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/lib/button-variants'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { McpConnectionConfig } from '@/lib/mcp-connection'

const CLIENTS = ['chatgpt', 'claude', 'codex', 'generic'] as const
const PROMPTS = ['guide', 'topic', 'review'] as const

export function McpGuidePage(config: McpConnectionConfig) {
  const t = useTranslations('mcpGuidePage')

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Bot aria-hidden="true" />
            <CardTitle>{t('connectionTitle')}</CardTitle>
            <Badge variant={config.oauthReady ? 'secondary' : 'outline'}>
              {config.oauthReady ? t('ready') : t('setupRequired')}
            </Badge>
          </div>
          <CardDescription>{t('connectionDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {config.requiresPublicOrigin ? (
            <div role="alert" className="rounded-xl border p-4 text-sm">
              <p className="flex items-center gap-2 font-medium"><CircleAlert aria-hidden="true" />{t('publicRequired')}</p>
              <p className="mt-2 text-muted-foreground">{t('publicDescription', { origin: config.appOrigin ?? t('notConfigured') })}</p>
            </div>
          ) : null}
          {!config.oauthReady ? (
            <div role="alert" className="rounded-xl border p-4 text-sm">
              <p className="font-medium">{t('oauthMissing')}</p>
              <p className="mt-2 text-muted-foreground">{t('missingConfig', { values: config.missingEnv.join(', ') })}</p>
            </div>
          ) : null}
          {config.endpointUrl ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">{t('endpoint')}</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input value={config.endpointUrl} readOnly className="font-mono text-xs" aria-label={t('endpoint')} />
                <CopyButton value={config.endpointUrl} label={t('endpointCopied')} />
              </div>
              <p className="text-xs text-muted-foreground">{t('endpointHint')}</p>
            </div>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border p-4">
              <p className="flex items-center gap-2 font-medium"><ShieldCheck aria-hidden="true" />{t('allowedTitle')}</p>
              <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
                <li>{t('allowedDecks')}</li><li>{t('allowedContracts')}</li><li>{t('allowedDrafts')}</li>
              </ul>
            </div>
            <div className="rounded-xl border p-4">
              <p className="flex items-center gap-2 font-medium"><LockKeyhole aria-hidden="true" />{t('blockedTitle')}</p>
              <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
                <li>{t('blockedPublish')}</li><li>{t('blockedDelete')}</li><li>{t('blockedAccounts')}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-4">
        <div><h2 className="text-2xl font-semibold">{t('clientsTitle')}</h2><p className="mt-1 text-muted-foreground">{t('clientsDescription')}</p></div>
        <Tabs defaultValue="chatgpt">
          <TabsList className="grid w-full grid-cols-2 group-data-horizontal/tabs:h-auto md:grid-cols-4">
            {CLIENTS.map((client) => <TabsTrigger key={client} value={client} className="min-h-8 w-full whitespace-normal py-2 text-center">{t(`${client}Title`)}</TabsTrigger>)}
          </TabsList>
          {CLIENTS.map((client) => (
            <TabsContent key={client} value={client}>
              <Card>
                <CardHeader><CardTitle>{t(`${client}Title`)}</CardTitle><CardDescription>{t(`${client}Availability`)}</CardDescription></CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <ol className="flex flex-col gap-3 text-sm">
                    {[1, 2, 3, 4].map((step) => (
                      <li key={step} className="flex gap-3">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted font-medium">{step}</span>
                        <span className="pt-1">{t(`${client}Step${step}`)}</span>
                      </li>
                    ))}
                  </ol>
                  {client === 'chatgpt' ? (
                    <a href="https://help.openai.com/en/articles/12584461-developer-mode-apps-and-full-mcp-connectors-in-chatgpt-beta" target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'outline', className: '!h-auto w-full min-w-0 !whitespace-normal break-words py-2 text-center' })}>
                      {t('officialDocs')}<ExternalLink data-icon="inline-end" />
                    </a>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </section>

      <section className="flex flex-col gap-4">
        <div><h2 className="text-2xl font-semibold">{t('promptsTitle')}</h2><p className="mt-1 text-muted-foreground">{t('promptsDescription')}</p></div>
        <div className="grid gap-4 lg:grid-cols-3">
          {PROMPTS.map((prompt) => {
            const value = t(`${prompt}Prompt`)
            return (
              <Card key={prompt}>
                <CardHeader><CardTitle>{t(`${prompt}Title`)}</CardTitle><CardDescription>{t(`${prompt}Description`)}</CardDescription></CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <pre className="whitespace-pre-wrap rounded-xl bg-muted p-4 text-xs leading-relaxed">{value}</pre>
                  <CopyButton value={value} label={t('promptCopied')} />
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}
