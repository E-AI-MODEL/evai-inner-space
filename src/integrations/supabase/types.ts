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
      emotion_seeds: {
        Row: {
          active: boolean | null
          created_at: string | null
          emotion: string
          expires_at: string | null
          id: string
          label: string | null
          meta: Json | null
          response: Json | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          emotion: string
          expires_at?: string | null
          id?: string
          label?: string | null
          meta?: Json | null
          response?: Json | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          emotion?: string
          expires_at?: string | null
          id?: string
          label?: string | null
          meta?: Json | null
          response?: Json | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      rubrics: {
        Row: {
          code: string | null
          id: string
          rubric_json: Json | null
        }
        Insert: {
          code?: string | null
          id?: string
          rubric_json?: Json | null
        }
        Update: {
          code?: string | null
          id?: string
          rubric_json?: Json | null
        }
        Relationships: []
      }
      seed_feedback: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          rating: string | null
          seed_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          rating?: string | null
          seed_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          rating?: string | null
          seed_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seed_feedback_seed_id_fkey"
            columns: ["seed_id"]
            isOneToOne: false
            referencedRelation: "emotion_seeds"
            referencedColumns: ["id"]
          },
        ]
      }
      seed_rubrics: {
        Row: {
          created_at: string | null
          id: string
          rubric: string | null
          score: number | null
          seed_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          rubric?: string | null
          score?: number | null
          seed_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          rubric?: string | null
          score?: number | null
          seed_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seed_rubrics_seed_id_fkey"
            columns: ["seed_id"]
            isOneToOne: false
            referencedRelation: "emotion_seeds"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_setting: {
        Args: { setting_key: string; default_value?: string }
        Returns: string
      }
      increment_seed_usage: {
        Args: Record<PropertyKey, never> | { seed_id: string }
        Returns: undefined
      }
      update_setting: {
        Args:
          | Record<PropertyKey, never>
          | { setting_key: string; setting_value: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
