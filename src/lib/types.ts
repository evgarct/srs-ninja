import type { Database } from './supabase/database.types'

// Table row types
export type Deck = Database['public']['Tables']['decks']['Row']
export type Note = Database['public']['Tables']['notes']['Row']
export type Card = Database['public']['Tables']['cards']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']
export type AudioCache = Database['public']['Tables']['audio_cache']['Row']
export type ReviewSessionCompletion = Database['public']['Tables']['review_session_completions']['Row']

// Card states (FSRS)
export type CardState = 'new' | 'learning' | 'review' | 'relearning'
export type CardType = 'recognition' | 'production' | 'listening'
export type Rating = 1 | 2 | 3 | 4 // again, hard, good, easy

// Languages
export type Language = 'czech' | 'english'

// CEFR levels
export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
export type CEFRLevel = typeof CEFR_LEVELS[number]

export const LEVEL_COLORS: Record<CEFRLevel, string> = {
  'A1': '🟩', 'A2': '🟨', 'B1': '🟦',
  'B2': '🟪', 'C1': '🟧', 'C2': '🟣',
}

// Parts of speech
export const PARTS_OF_SPEECH_CZECH = [
  'podstatné jméno',
  'sloveso',
  'přídavné jméno',
  'příslovce',
  'zájmeno',
  'předložka',
  'spojka',
  'částice',
  'citoslovce',
  'číslovka',
  'fráze',
  'idiom',
] as const

export const PARTS_OF_SPEECH_ENGLISH = [
  'noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition',
  'conjunction', 'phrasal verb', 'expression', 'idiom', 'collocation',
] as const

// Style/register
export const STYLE_REGISTERS = [
  'informal', 'neutral', 'formal', 'everyday',
  'technical', 'academic', 'narrative', 'slang', 'poetic',
] as const

export const STYLE_EMOJI: Record<string, string> = {
  'informal': '💬', 'neutral': '🎓', 'formal': '🧠',
  'everyday': '⚙️', 'technical': '🧰', 'academic': '📚',
  'narrative': '📖', 'slang': '🗣️', 'poetic': '✨',
}

// Gender (Czech only)
export const GENDERS_CZECH = ['mužský', 'ženský', 'střední', '—'] as const

export const CEFR_LEVELS_CZECH = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const

export const STYLE_REGISTERS_CZECH = [
  'neutrální',
  'hovorový',
  'formální',
  'knižní',
  'obecná čeština',
  'slangový',
  'odborný',
] as const

export const GENDERS_CZECH_RU = [
  'mužský životný',
  'mužský neživotný',
  'ženský',
  'střední',
] as const

export const CZECH_VERB_CLASSES = ['-at', '-it/-et/-ět', '-ovat', 'nepravidelný'] as const
