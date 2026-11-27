import type { SupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { assertValidLanguagePair } from '@/lib/deck-languages'
import { isMissingCompletionTableError } from '@/lib/review-session-completions'
import type { Database } from '@/lib/supabase/database.types'

// Deck writes shared by the web server actions (src/lib/actions/decks.ts) and MCP.

export type ReviewSessionType = 'due' | 'manual' | 'extra'

export async function createDeckForUser(
  supabase: SupabaseClient,
  userId: string,
  input: { name: string; language: string; translationLanguage: string; description?: string | null }
) {
  assertValidLanguagePair(input.language, input.translationLanguage)
  const name = input.name.trim()
  if (!name) throw new Error('Deck name is required')

  const { data, error } = await supabase
    .from('decks')
    .insert({ name, language: input.language, translation_language: input.translationLanguage, user_id: userId, ...(input.description ? { description: input.description } : {}) })
    .select()
    .single()
  if (error) throw error

  revalidatePath('/')
  return data as Database['public']['Tables']['decks']['Row']
}

/** Records a finished session so the deck shows "done for today" on every device. */
export async function markReviewSessionCompletedForUser(supabase: SupabaseClient, userId: string, deckId: string, sessionType: ReviewSessionType) {
  const { error } = await supabase
    .from('review_session_completions')
    .insert({ deck_id: deckId, user_id: userId, session_type: sessionType })

  if (error && !isMissingCompletionTableError(error)) throw error
  revalidatePath('/')
}
