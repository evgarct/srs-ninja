import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: decks, error } = await supabase
    .from('decks')
    .select('id, name, language, description')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch decks' }, { status: 500 })
  }

  return NextResponse.json({ decks: decks ?? [] })
}
