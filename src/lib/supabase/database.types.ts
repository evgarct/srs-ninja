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
          description: string | null
          field_schema: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          language: string
          description?: string | null
          field_schema?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          language?: string
          description?: string | null
          field_schema?: Json | null
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
          anki_guid: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          deck_id: string
          fields: Json
          tags?: string[]
          anki_guid?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          deck_id?: string
          fields?: Json
          tags?: string[]
          anki_guid?: string | null
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
          elapsed_days: number
          scheduled_days: number
          reps: number
          lapses: number
          last_review: string | null
          due_at: string
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
          elapsed_days?: number
          scheduled_days?: number
          reps?: number
          lapses?: number
          last_review?: string | null
          due_at?: string
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
          elapsed_days?: number
          scheduled_days?: number
          reps?: number
          lapses?: number
          last_review?: string | null
          due_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          card_id: string
          user_id: string
          rating: number
          state: string
          scheduled_days: number
          elapsed_days: number
          review_duration_ms: number | null
          reviewed_at: string
        }
        Insert: {
          id?: string
          card_id: string
          user_id: string
          rating: number
          state: string
          scheduled_days: number
          elapsed_days: number
          review_duration_ms?: number | null
          reviewed_at?: string
        }
        Update: {
          id?: string
          card_id?: string
          user_id?: string
          rating?: number
          state?: string
          scheduled_days?: number
          elapsed_days?: number
          review_duration_ms?: number | null
          reviewed_at?: string
        }
      }
      audio_cache: {
        Row: {
          id: string
          note_id: string
          field_key: string
          language: string
          voice_id: string
          storage_path: string
          created_at: string
        }
        Insert: {
          id?: string
          note_id: string
          field_key: string
          language: string
          voice_id: string
          storage_path: string
          created_at?: string
        }
        Update: {
          id?: string
          note_id?: string
          field_key?: string
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
