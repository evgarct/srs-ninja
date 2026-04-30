'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bot, CircleAlert, ExternalLink, Link2, ShieldCheck } from 'lucide-react'
import { CopyButton } from '@/components/copy-button'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { brand } from '@/lib/brand'

interface McpConnectPanelProps {
  appOrigin: string | null
  endpointUrl: string | null
  connectionUrl: string | null
  hasPersonalConfig: boolean
  missingEnv: string[]
  requiresPublicOrigin: boolean
}

type AgentId = 'chatgpt' | 'claude'

const AGENTS: Array<{
  id: AgentId
  name: string
  description: string
  available: boolean
}> = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    description: 'Remote MCP server for draft note import and review-safe approval flow.',
    available: true,
  },
  {
    id: 'claude',
    name: 'Claude',
    description: 'Reserved for future onboarding once we add a dedicated integration flow.',
    available: false,
  },
]

const ENGLISH_IMPORT_PROMPT = `When importing into an English deck, always use the canonical English note schema.

Required fields:
- word
- translation

Optional fields:
- level: A1 | A2 | B1 | B2 | C1 | C2
- part_of_speech: noun | verb | adjective | adverb | pronoun | preposition | conjunction | phrasal verb | expression | idiom | collocation
- popularity: integer 1..10
- style: informal | neutral | formal | everyday | technical | academic | narrative | slang | poetic
- synonyms: string[]
- antonyms: string[]
- examples_html: HTML <ul> with exactly 2 <li> examples and the studied word wrapped in <b>
- tags: string[] stored separately from fields

Do not use legacy English fields like term, expression, frequency, example_sentence, example_translation, or collocations for new notes.

Use the English tag system consistently. Recommended tag families:
- ENGLISH::topic.*
- ENGLISH::style.*
- ENGLISH::level.*
- ENGLISH::grammar.*
- ENGLISH::source.*
- ENGLISH::set.*

When calling save_draft_notes:
- put note tags into item.tags
- put batch-level requested tags into metadata.requestedTags

Before saving, call get_deck_contract and match the returned field contract exactly.`

const CZECH_IMPORT_PROMPT = `When importing into a Czech deck, always use the canonical Czech note schema.

id: deck/69b0bf5f-38e0-4fa1-8c44-0922cb403661

Required fields:
- word
- translation

Optional fields:
- level: A2 | B1 | B2 | C1 | C2
- part_of_speech: podstatné jméno | sloveso | přídavné jméno | příslovce | zájmeno | předložka | spojka | částice | citoslovce | číslovka | fráze | idiom
- popularity: integer 1..10
- style: neutrální | hovorový | formální | knižní | obecná čeština | slangový | odborný
- gender: mužský životný | mužský neživotný | ženský | střední — only for nouns
- verb_class: -at | -it/-et/-ět | -ovat | nepravidelný — only for verbs
- verb_irregular: string
- synonyms: string[]
- antonyms: string[]
- examples_html: HTML <ul> with exactly 2 <li> examples in Czech, studied word wrapped in <b>
- note: string
- tags: string[] stored separately from fields

Language rules:
- word, synonyms, antonyms, examples_html, verb_irregular, note — Czech only
- translation — Russian only
- enum values — use exact values from contract as listed above

Do not use legacy Czech fields like expression, term, pronunciation, example_sentence, example_translation, frequency, or image_url for new notes.

Use the Czech tag system consistently. Recommended tag families:
- CZECH::topic.*
- CZECH::style.*
- CZECH::level.*
- CZECH::grammar.*
- CZECH::source.*
- CZECH::set.*

When calling save_draft_notes:
- put note tags into item.tags
- put batch-level requested tags into metadata.requestedTags

Before saving, call get_deck_contract and match the returned field contract exactly.`

export function McpConnectPanel({
  appOrigin,
  endpointUrl,
  connectionUrl,
  hasPersonalConfig,
  missingEnv,
  requiresPublicOrigin,
}: McpConnectPanelProps) {
  const [selectedAgent, setSelectedAgent] = useState<AgentId>('chatgpt')

  const selected = AGENTS.find((agent) => agent.id === selectedAgent) ?? AGENTS[0]
  const canConnect = selected.id === 'chatgpt' && hasPersonalConfig && Boolean(connectionUrl)

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>AI Agents</CardTitle>
          <CardDescription>
            Choose where you want to connect {brand.mcp.agentProductName} draft import.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {AGENTS.map((agent) => {
            const isSelected = agent.id === selected.id

            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => agent.available && setSelectedAgent(agent.id)}
                className={[
                  'w-full rounded-xl border p-4 text-left transition-colors',
                  isSelected ? 'border-foreground/30 bg-muted/60' : 'border-border hover:bg-muted/40',
                  agent.available ? '' : 'cursor-not-allowed opacity-60',
                ].join(' ')}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Bot className="size-4" />
                    <span className="font-medium">{agent.name}</span>
                  </div>
                  <Badge variant={agent.available ? 'secondary' : 'outline'}>
                    {agent.available ? 'Available' : 'Soon'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{agent.description}</p>
              </button>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Connect {selected.name}</CardTitle>
            {canConnect ? (
              <Badge variant="secondary">Ready</Badge>
            ) : (
              <Badge variant="outline">Setup required</Badge>
            )}
            {requiresPublicOrigin && (
              <Badge variant="outline">Public URL needed</Badge>
            )}
          </div>
          <CardDescription>
            Connect ChatGPT to the remote MCP server, generate draft notes, then review and approve them inside {brand.mcp.agentProductName}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {selected.id !== 'chatgpt' ? (
            <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              This agent is not wired yet. ChatGPT is the supported path in this MVP.
            </div>
          ) : (
            <>
              {requiresPublicOrigin && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
                  <div className="mb-2 flex items-center gap-2 font-medium text-amber-700 dark:text-amber-300">
                    <CircleAlert className="size-4" />
                    ChatGPT cannot reach localhost directly
                  </div>
                  <p className="text-muted-foreground">
                    The current app origin is {appOrigin ?? 'not detected'}. Use a deployed HTTPS URL or an HTTPS tunnel before adding this MCP server in ChatGPT.
                  </p>
                </div>
              )}

              {!hasPersonalConfig && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
                  <div className="mb-2 flex items-center gap-2 font-medium text-destructive">
                    <CircleAlert className="size-4" />
                    Personal MCP mode is not fully configured
                  </div>
                  <p className="text-muted-foreground">
                    Add these env vars on the app server to generate a direct ChatGPT connection URL:
                  </p>
                  <p className="mt-2 font-mono text-xs">
                    {missingEnv.join(', ')}
                  </p>
                </div>
              )}

              {endpointUrl && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Remote MCP endpoint</p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input value={endpointUrl} readOnly className="font-mono text-xs" />
                    <CopyButton value={endpointUrl} label="Endpoint copied" className="sm:self-start" />
                  </div>
                </div>
              )}

              {connectionUrl && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-muted-foreground" />
                    <p className="text-sm font-medium">ChatGPT connection URL</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input value={connectionUrl} readOnly className="font-mono text-xs" />
                    <CopyButton value={connectionUrl} label="Connection URL copied" className="sm:self-start" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Keep this URL private. It includes the MCP shared secret for your account.
                  </p>
                </div>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <p className="mb-3 text-sm font-medium">How to connect</p>
                  <ol className="space-y-2 text-sm text-muted-foreground">
                    <li>1. Open ChatGPT and add a custom MCP server.</li>
                    <li>2. Paste the connection URL from this page.</li>
                    <li>3. Ask ChatGPT to list decks and fetch the deck contract.</li>
                    <li>4. Save candidate notes as drafts, then review them in {brand.mcp.agentProductName}.</li>
                  </ol>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="mb-3 text-sm font-medium">What ChatGPT can do</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Link2 className="mt-0.5 size-4 shrink-0" />
                      List your decks and read the language-specific field contract.
                    </li>
                    <li className="flex items-start gap-2">
                      <Link2 className="mt-0.5 size-4 shrink-0" />
                      Save AI-generated candidates as draft notes grouped by import batch.
                    </li>
                    <li className="flex items-start gap-2">
                      <Link2 className="mt-0.5 size-4 shrink-0" />
                      Use the canonical English schema with `popularity`, `synonyms`, `antonyms`, and `examples_html`.
                    </li>
                    <li className="flex items-start gap-2">
                      <Link2 className="mt-0.5 size-4 shrink-0" />
                      Keep note tags in `item.tags` and follow the `ENGLISH::topic/style/level/...` taxonomy.
                    </li>
                    <li className="flex items-start gap-2">
                      <Link2 className="mt-0.5 size-4 shrink-0" />
                      List draft batches and approve reviewed notes without bypassing app validation.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="rounded-xl border p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">ChatGPT English import prompt</p>
                    <p className="text-xs text-muted-foreground">
                      Paste this once after connecting ChatGPT to keep English imports on the canonical schema.
                    </p>
                  </div>
                  <CopyButton
                    value={ENGLISH_IMPORT_PROMPT}
                    label="Prompt copied"
                    className="shrink-0"
                  />
                </div>
                <pre className="overflow-x-auto rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground whitespace-pre-wrap break-words">
                  {ENGLISH_IMPORT_PROMPT}
                </pre>
              </div>

              <div className="rounded-xl border p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">ChatGPT Czech import prompt</p>
                    <p className="text-xs text-muted-foreground">
                      Use this for Czech decks so draft fields stay aligned with the app schema and MCP contract.
                    </p>
                  </div>
                  <CopyButton
                    value={CZECH_IMPORT_PROMPT}
                    label="Prompt copied"
                    className="shrink-0"
                  />
                </div>
                <pre className="overflow-x-auto rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground whitespace-pre-wrap break-words">
                  {CZECH_IMPORT_PROMPT}
                </pre>
              </div>

              <div className="flex flex-wrap gap-2">
                <a
                  href="https://chatgpt.com/"
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants()}
                >
                  Open ChatGPT
                  <ExternalLink className="size-4" />
                </a>
                <Link href="/import#anki-import" className={buttonVariants({ variant: 'outline' })}>
                  Open Anki Import
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
