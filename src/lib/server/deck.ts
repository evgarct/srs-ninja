import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'

export const getDeckById = cache(async (deckId: string) => {
  const supabase = await createClient()
  const { data } = await supabase.from('decks').select('*').eq('id', deckId).single()
  return data
})
