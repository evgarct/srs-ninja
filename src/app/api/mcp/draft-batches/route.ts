import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listDraftBatchesForUser } from '@/lib/draft-import-service'

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const deckId = url.searchParams.get('deckId') ?? undefined

  try {
    const batches = await listDraftBatchesForUser(supabase, user.id, deckId)
    return NextResponse.json({ batches })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch draft batches' }, { status: 500 })
  }
}
