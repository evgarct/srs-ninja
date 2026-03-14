export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      decks: {
        Row: {
          id: string
          user_id: string
          name: string
          language: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          language: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          language?: string
          created_at?: string
          updated_at?: string
        }
      }
      notes: {
        Row: {
          id: string
          user_id: string
          deck_id: string
          fields: Json
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          deck_id: string
          fields: Json
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          deck_id?: string
          fields?: Json
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      cards: {
        Row: {
          id: string
          user_id: string
          note_id: string
          card_type: string
          state: string
          stability: number
          difficulty: number
          due_at: string
          last_review_at: string | null
          reps: number
          lapses: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          note_id: string
          card_type: string
          state?: string
          stability?: number
          difficulty?: number
          due_at?: string
          last_review_at?: string | null
          reps?: number
          lapses?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          note_id?: string
          card_type?: string
          state?: string
          stability?: number
          difficulty?: number
          due_at?: string
          last_review_at?: string | null
          reps?: number
          lapses?: number
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          card_id: string
          rating: number
          state_before: string
          state_after: string
          stability_before: number
          stability_after: number
          difficulty_before: number
          difficulty_after: number
          scheduled_days: number
          elapsed_days: number
          review_duration_ms: number | null
          reviewed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          card_id: string
          rating: number
          state_before: string
          state_after: string
          stability_before: number
          stability_after: number
          difficulty_before: number
          difficulty_after: number
          scheduled_days: number
          elapsed_days: number
          review_duration_ms?: number | null
          reviewed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          card_id?: string
          rating?: number
          state_before?: string
          state_after?: string
          stability_before?: number
          stability_after?: number
          difficulty_before?: number
          difficulty_after?: number
          scheduled_days?: number
          elapsed_days?: number
          review_duration_ms?: number | null
          reviewed_at?: string
          created_at?: string
        }
      }
      audio_cache: {
        Row: {
          id: string
          user_id: string
          text: string
          language: string
          voice_id: string
          storage_path: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          text: string
          language: string
          voice_id: string
          storage_path: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          text?: string
          language?: string
          voice_id?: string
          storage_path?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
