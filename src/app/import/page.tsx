import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { getDecks } from '@/lib/actions/decks'
import { AnkiImporter } from '@/components/anki-importer'
import { McpConnectPanel } from '@/components/mcp-connect-panel'
import { DraftStatusBadge } from '@/components/draft-status-badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/lib/button-variants'
import { buildMcpConnectionConfig, resolveAppOrigin } from '@/lib/mcp-connection'
import type { Database } from '@/lib/supabase/database.types'

type RecentBatchRow = Database['public']['Tables']['import_batches']['Row'] & {
  decks?: { name: string } | Array<{ name: string }>
}

export default async function ImportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const decks = await getDecks()
  const requestHeaders = await headers()
  const appOrigin = resolveAppOrigin({
    envOrigin: process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? null,
    forwardedProto: requestHeaders.get('x-forwarded-proto'),
    forwardedHost: requestHeaders.get('x-forwarded-host'),
    host: requestHeaders.get('host'),
  })
  const mcpConfig = buildMcpConnectionConfig({
    appOrigin,
    sharedSecret: process.env.MCP_SHARED_SECRET,
    userId: process.env.MCP_USER_ID,
  })
  const { data: recentBatchesData } = await supabase
    .from('import_batches')
    .select('*, decks(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(6)

  const recentBatches = ((recentBatchesData ?? []) as RecentBatchRow[]).map((batch) => ({
    ...batch,
    deckName: Array.isArray(batch.decks) ? batch.decks[0]?.name ?? 'Deck' : batch.decks?.name ?? 'Deck',
  }))

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Import Center</h1>
        <p className="text-muted-foreground">
          Connect AI agents for draft-first imports or upload classic Anki packages.
        </p>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">AI Agent Connection</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Connect ChatGPT to the remote MCP endpoint, save generated notes as drafts, then review them safely in the app.
          </p>
        </div>
        <McpConnectPanel {...mcpConfig} />
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Review Imported Drafts</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Jump back into the latest draft batches and approve them deck by deck.
            </p>
          </div>
        </div>

        {recentBatches.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No draft import batches yet. Connect ChatGPT above and save your first draft batch.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recentBatches.map((batch) => (
              <Card key={batch.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-base">{batch.deckName}</CardTitle>
                    <DraftStatusBadge
                      status={batch.status as 'draft' | 'partially_approved' | 'approved' | 'archived'}
                    />
                  </div>
                  <CardDescription>
                    {batch.topic?.trim() || `Batch created on ${batch.created_at.slice(0, 10)}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>{batch.notes_count} notes</p>
                    {batch.model_name && <p>Model: {batch.model_name}</p>}
                    <p>Source: {batch.source}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/deck/${batch.deck_id}/drafts?batchId=${batch.id}`}
                      className={buttonVariants()}
                    >
                      Open Batch Review
                    </Link>
                    <Link
                      href={`/deck/${batch.deck_id}/drafts`}
                      className={buttonVariants({ variant: 'outline' })}
                    >
                      Open Deck Drafts
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4" id="anki-import">
        <div>
          <h2 className="text-xl font-semibold">Anki Package Import</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Upload a `.apkg` file to import notes directly into an existing deck.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Import from Anki</CardTitle>
            <CardDescription>
              Load notes from an Anki package. Imported notes are created as regular approved notes with fresh FSRS cards.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnkiImporter decks={decks} />
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
