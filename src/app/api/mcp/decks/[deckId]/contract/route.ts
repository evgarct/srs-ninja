import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDraftFieldContract } from '@/lib/draft-import'
import type { Language } from '@/lib/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ deckId: string }> }
) {
  const { deckId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: deck, error } = await supabase
    .from('decks')
    .select('id, name, language, description')
    .eq('id', deckId)
    .eq('user_id', user.id)
    .single()

  if (error || !deck) {
    return NextResponse.json({ error: 'Deck not found' }, { status: 404 })
  }

  return NextResponse.json({
    deck,
    contract: getDraftFieldContract(deck.language as Language),
  })
}
