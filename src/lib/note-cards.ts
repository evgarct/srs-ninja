import { newFSRSCard } from '@/lib/fsrs'
import type { Database } from '@/lib/supabase/database.types'

type CardInsert = Database['public']['Tables']['cards']['Insert']

export function buildInitialNoteCards(noteId: string, userId: string): CardInsert[] {
  const fsrsCard = newFSRSCard()
  const now = new Date().toISOString()

  return ['recognition', 'production'].map((cardType) => ({
    note_id: noteId,
    user_id: userId,
    card_type: cardType,
    state: 'new',
    stability: fsrsCard.stability,
    difficulty: fsrsCard.difficulty,
    due_at: now,
    reps: 0,
    lapses: 0,
  }))
}
