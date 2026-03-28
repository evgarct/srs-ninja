import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getDecks } from '@/lib/actions/decks'
import { AnkiImporter } from '@/components/anki-importer'
import { ImportReviewBatchCard } from '@/components/import-review-batch-card'
import { McpConnectPanel } from '@/components/mcp-connect-panel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cleanupEmptyImportBatchesForUser } from '@/lib/draft-import-service'
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

  await cleanupEmptyImportBatchesForUser(supabase, user.id)

  const { data: recentBatchesData } = await supabase
    .from('import_batches')
    .select('*, decks(name)')
    .eq('user_id', user.id)
    .in('status', ['draft', 'partially_approved'])
    .order('created_at', { ascending: false })
    .limit(6)

  const batchIds = ((recentBatchesData ?? []) as RecentBatchRow[]).map((batch) => batch.id)
  const { data: draftNotesData } = batchIds.length
    ? await supabase
        .from('notes')
        .select('import_batch_id')
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .in('import_batch_id', batchIds)
    : { data: [] }

  const draftCountsByBatchId = new Map<string, number>()
  for (const note of (draftNotesData ?? []) as Array<{ import_batch_id: string | null }>) {
    if (!note.import_batch_id) continue
    draftCountsByBatchId.set(
      note.import_batch_id,
      (draftCountsByBatchId.get(note.import_batch_id) ?? 0) + 1
    )
  }

  const recentBatches = ((recentBatchesData ?? []) as RecentBatchRow[])
    .map((batch) => ({
    ...batch,
    deckName: Array.isArray(batch.decks) ? batch.decks[0]?.name ?? 'Deck' : batch.decks?.name ?? 'Deck',
      draftCount: draftCountsByBatchId.get(batch.id) ?? 0,
    }))
    .filter((batch) => batch.draftCount > 0)

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
              No imported draft batches need review right now. New AI draft batches will appear here until they are approved or cleared.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {recentBatches.map((batch) => (
              <ImportReviewBatchCard
                key={batch.id}
                id={batch.id}
                deckId={batch.deck_id}
                deckName={batch.deckName}
                topic={batch.topic}
                createdAt={batch.created_at}
                updatedAt={batch.updated_at}
                source={batch.source}
                modelName={batch.model_name}
                draftCount={batch.draftCount}
                status={batch.status as 'draft' | 'partially_approved' | 'approved' | 'archived'}
                showDelete={batch.status === 'draft'}
              />
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
