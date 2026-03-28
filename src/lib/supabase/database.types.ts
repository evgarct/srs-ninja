export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.4'
  }
  public: {
    Tables: {
      audio_cache: {
        Row: {
          created_at: string
          field_key: string
          id: string
          language: string
          note_id: string
          storage_path: string
          voice_id: string | null
        }
        Insert: {
          created_at?: string
          field_key: string
          id?: string
          language: string
          note_id: string
          storage_path: string
          voice_id?: string | null
        }
        Update: {
          created_at?: string
          field_key?: string
          id?: string
          language?: string
          note_id?: string
          storage_path?: string
          voice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'audio_cache_note_id_fkey'
            columns: ['note_id']
            isOneToOne: false
            referencedRelation: 'notes'
            referencedColumns: ['id']
          },
        ]
      }
      cards: {
        Row: {
          card_type: string
          created_at: string
          difficulty: number
          due_at: string
          elapsed_days: number
          id: string
          lapses: number
          last_review: string | null
          note_id: string
          reps: number
          scheduled_days: number
          stability: number
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          card_type?: string
          created_at?: string
          difficulty?: number
          due_at?: string
          elapsed_days?: number
          id?: string
          lapses?: number
          last_review?: string | null
          note_id: string
          reps?: number
          scheduled_days?: number
          stability?: number
          state?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          card_type?: string
          created_at?: string
          difficulty?: number
          due_at?: string
          elapsed_days?: number
          id?: string
          lapses?: number
          last_review?: string | null
          note_id?: string
          reps?: number
          scheduled_days?: number
          stability?: number
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'cards_note_id_fkey'
            columns: ['note_id']
            isOneToOne: false
            referencedRelation: 'notes'
            referencedColumns: ['id']
          },
        ]
      }
      decks: {
        Row: {
          created_at: string
          description: string | null
          field_schema: Json
          id: string
          language: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          field_schema?: Json
          id?: string
          language: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          field_schema?: Json
          id?: string
          language?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      import_batches: {
        Row: {
          created_at: string
          deck_id: string
          id: string
          input_payload: Json | null
          model_name: string | null
          notes_count: number
          prompt_version: string | null
          requested_tags: string[]
          source: string
          status: string
          topic: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deck_id: string
          id?: string
          input_payload?: Json | null
          model_name?: string | null
          notes_count?: number
          prompt_version?: string | null
          requested_tags?: string[]
          source?: string
          status?: string
          topic?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deck_id?: string
          id?: string
          input_payload?: Json | null
          model_name?: string | null
          notes_count?: number
          prompt_version?: string | null
          requested_tags?: string[]
          source?: string
          status?: string
          topic?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'import_batches_deck_id_fkey'
            columns: ['deck_id']
            isOneToOne: false
            referencedRelation: 'decks'
            referencedColumns: ['id']
          },
        ]
      }
      notes: {
        Row: {
          anki_guid: string | null
          created_at: string
          deck_id: string
          fields: Json
          id: string
          import_batch_id: string | null
          draft_conflict: Json | null
          source: string
          status: string
          tags: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          anki_guid?: string | null
          created_at?: string
          deck_id: string
          fields?: Json
          id?: string
          import_batch_id?: string | null
          draft_conflict?: Json | null
          source?: string
          status?: string
          tags?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          anki_guid?: string | null
          created_at?: string
          deck_id?: string
          fields?: Json
          id?: string
          import_batch_id?: string | null
          draft_conflict?: Json | null
          source?: string
          status?: string
          tags?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notes_deck_id_fkey'
            columns: ['deck_id']
            isOneToOne: false
            referencedRelation: 'decks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notes_import_batch_id_fkey'
            columns: ['import_batch_id']
            isOneToOne: false
            referencedRelation: 'import_batches'
            referencedColumns: ['id']
          },
        ]
      }
      reviews: {
        Row: {
          card_id: string
          elapsed_days: number
          id: string
          rating: number
          review_duration_ms: number | null
          reviewed_at: string
          scheduled_days: number
          state: string
          user_id: string
        }
        Insert: {
          card_id: string
          elapsed_days: number
          id?: string
          rating: number
          review_duration_ms?: number | null
          reviewed_at?: string
          scheduled_days: number
          state: string
          user_id: string
        }
        Update: {
          card_id?: string
          elapsed_days?: number
          id?: string
          rating?: number
          review_duration_ms?: number | null
          reviewed_at?: string
          scheduled_days?: number
          state?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reviews_card_id_fkey'
            columns: ['card_id']
            isOneToOne: false
            referencedRelation: 'cards'
            referencedColumns: ['id']
          },
        ]
      }
      review_session_completions: {
        Row: {
          completed_at: string
          created_at: string
          deck_id: string
          id: string
          session_type: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          deck_id: string
          id?: string
          session_type: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          deck_id?: string
          id?: string
          session_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'review_session_completions_deck_id_fkey'
            columns: ['deck_id']
            isOneToOne: false
            referencedRelation: 'decks'
            referencedColumns: ['id']
          },
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof DatabaseWithoutInternals, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer Row
    }
    ? Row
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer Row
      }
      ? Row
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer Insert
    }
    ? Insert
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer Insert
      }
      ? Insert
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer Update
    }
    ? Update
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer Update
      }
      ? Update
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
