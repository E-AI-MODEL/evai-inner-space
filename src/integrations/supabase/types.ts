export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      api_collaboration_logs: {
        Row: {
          api1_used: boolean | null
          api2_used: boolean | null
          created_at: string
          error_details: Json | null
          google_api_used: boolean | null
          id: string
          metadata: Json | null
          processing_time_ms: number | null
          secondary_analysis: boolean | null
          seed_generated: boolean | null
          session_id: string | null
          success: boolean | null
          user_id: string
          vector_api_used: boolean | null
          version: string | null
          workflow_type: string
        }
        Insert: {
          api1_used?: boolean | null
          api2_used?: boolean | null
          created_at?: string
          error_details?: Json | null
          google_api_used?: boolean | null
          id?: string
          metadata?: Json | null
          processing_time_ms?: number | null
          secondary_analysis?: boolean | null
          seed_generated?: boolean | null
          session_id?: string | null
          success?: boolean | null
          user_id?: string
          vector_api_used?: boolean | null
          version?: string | null
          workflow_type: string
        }
        Update: {
          api1_used?: boolean | null
          api2_used?: boolean | null
          created_at?: string
          error_details?: Json | null
          google_api_used?: boolean | null
          id?: string
          metadata?: Json | null
          processing_time_ms?: number | null
          secondary_analysis?: boolean | null
          seed_generated?: boolean | null
          session_id?: string | null
          success?: boolean | null
          user_id?: string
          vector_api_used?: boolean | null
          version?: string | null
          workflow_type?: string
        }
        Relationships: []
      }
      decision_logs: {
        Row: {
          api_collaboration: Json | null
          confidence_score: number
          conversation_id: string | null
          created_at: string
          final_response: string
          hybrid_decision: Json
          id: string
          neural_similarities: Json | null
          processing_time_ms: number | null
          rubrics_analysis: Json | null
          symbolic_matches: Json | null
          user_id: string
          user_input: string
          workflow_version: string | null
        }
        Insert: {
          api_collaboration?: Json | null
          confidence_score: number
          conversation_id?: string | null
          created_at?: string
          final_response: string
          hybrid_decision: Json
          id?: string
          neural_similarities?: Json | null
          processing_time_ms?: number | null
          rubrics_analysis?: Json | null
          symbolic_matches?: Json | null
          user_id?: string
          user_input: string
          workflow_version?: string | null
        }
        Update: {
          api_collaboration?: Json | null
          confidence_score?: number
          conversation_id?: string | null
          created_at?: string
          final_response?: string
          hybrid_decision?: Json
          id?: string
          neural_similarities?: Json | null
          processing_time_ms?: number | null
          rubrics_analysis?: Json | null
          symbolic_matches?: Json | null
          user_id?: string
          user_input?: string
          workflow_version?: string | null
        }
        Relationships: []
      }
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
          user_id: string
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
          user_id?: string
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
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      reflection_logs: {
        Row: {
          actions_taken: Json | null
          context: Json
          created_at: string
          id: string
          insights: Json | null
          learning_impact: number | null
          new_seeds_generated: number | null
          trigger_type: string
          user_id: string
        }
        Insert: {
          actions_taken?: Json | null
          context: Json
          created_at?: string
          id?: string
          insights?: Json | null
          learning_impact?: number | null
          new_seeds_generated?: number | null
          trigger_type: string
          user_id?: string
        }
        Update: {
          actions_taken?: Json | null
          context?: Json
          created_at?: string
          id?: string
          insights?: Json | null
          learning_impact?: number | null
          new_seeds_generated?: number | null
          trigger_type?: string
          user_id?: string
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
      rubrics_assessments: {
        Row: {
          confidence_level: string | null
          conversation_id: string | null
          created_at: string
          id: string
          message_content: string
          overall_score: number | null
          processing_mode: string | null
          protective_score: number | null
          risk_score: number | null
          rubric_id: string
          triggers: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_level?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_content: string
          overall_score?: number | null
          processing_mode?: string | null
          protective_score?: number | null
          risk_score?: number | null
          rubric_id: string
          triggers?: Json | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          confidence_level?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_content?: string
          overall_score?: number | null
          processing_mode?: string | null
          protective_score?: number | null
          risk_score?: number | null
          rubric_id?: string
          triggers?: Json | null
          updated_at?: string
          user_id?: string
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
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          rating?: string | null
          seed_id?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          rating?: string | null
          seed_id?: string | null
          user_id?: string
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
          category: string | null
          id: string
          key: string
          updated_at: string | null
          user_id: string
          value: string
        }
        Insert: {
          category?: string | null
          id?: string
          key: string
          updated_at?: string | null
          user_id?: string
          value: string
        }
        Update: {
          category?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      unified_knowledge: {
        Row: {
          active: boolean | null
          confidence_score: number | null
          content_type: string
          created_at: string | null
          emotion: string
          id: string
          last_used: string | null
          metadata: Json | null
          response_text: string | null
          search_vector: unknown | null
          triggers: string[] | null
          updated_at: string | null
          usage_count: number | null
          user_id: string
          vector_embedding: string | null
        }
        Insert: {
          active?: boolean | null
          confidence_score?: number | null
          content_type: string
          created_at?: string | null
          emotion: string
          id?: string
          last_used?: string | null
          metadata?: Json | null
          response_text?: string | null
          search_vector?: unknown | null
          triggers?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
          vector_embedding?: string | null
        }
        Update: {
          active?: boolean | null
          confidence_score?: number | null
          content_type?: string
          created_at?: string | null
          emotion?: string
          id?: string
          last_used?: string | null
          metadata?: Json | null
          response_text?: string | null
          search_vector?: unknown | null
          triggers?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
          vector_embedding?: string | null
        }
        Relationships: []
      }
      vector_embeddings: {
        Row: {
          content_id: string
          content_text: string
          content_type: string
          created_at: string
          embedding: string | null
          id: string
          metadata: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content_id: string
          content_text: string
          content_type: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          content_id?: string
          content_text?: string
          content_type?: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consolidate_knowledge: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      find_similar_embeddings: {
        Args:
          | {
              query_embedding: string
              similarity_threshold?: number
              max_results?: number
            }
          | {
              query_embedding: string
              similarity_threshold?: number
              max_results?: number
            }
        Returns: {
          content_id: string
          content_type: string
          content_text: string
          similarity_score: number
          metadata: Json
        }[]
      }
      get_google_api_key: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_recent_reflection_logs: {
        Args: { p_limit?: number }
        Returns: {
          id: string
          created_at: string
          trigger_type: string
          context: Json
          new_seeds_generated: number
          learning_impact: number
        }[]
      }
      get_setting: {
        Args: { setting_key: string; default_value?: string }
        Returns: string
      }
      get_single_user_setting: {
        Args: { setting_key: string; default_value?: string }
        Returns: string
      }
      get_user_setting: {
        Args: { setting_key: string; default_value?: string }
        Returns: string
      }
      increment_seed_usage: {
        Args: Record<PropertyKey, never> | { seed_id: string }
        Returns: undefined
      }
      log_evai_workflow: {
        Args:
          | {
              p_conversation_id: string
              p_workflow_type: string
              p_api_collaboration: Json
              p_rubrics_data?: Json
              p_processing_time?: number
              p_success?: boolean
              p_error_details?: Json
            }
          | {
              p_user_id: string
              p_conversation_id: string
              p_workflow_type: string
              p_api_collaboration: Json
              p_rubrics_data?: Json
              p_processing_time?: number
              p_success?: boolean
              p_error_details?: Json
            }
        Returns: string
      }
      log_hybrid_decision: {
        Args:
          | {
              p_user_id: string
              p_user_input: string
              p_symbolic_matches: Json
              p_neural_similarities: Json
              p_hybrid_decision: Json
              p_final_response: string
              p_confidence_score: number
              p_processing_time_ms?: number
            }
          | {
              p_user_input: string
              p_symbolic_matches: Json
              p_neural_similarities: Json
              p_hybrid_decision: Json
              p_final_response: string
              p_confidence_score: number
              p_processing_time_ms?: number
            }
        Returns: string
      }
      log_reflection_event: {
        Args: {
          p_trigger_type: string
          p_context: Json
          p_new_seeds_generated?: number
          p_learning_impact?: number
        }
        Returns: string
      }
      search_unified_knowledge: {
        Args:
          | {
              query_text: string
              query_embedding: string
              similarity_threshold?: number
              max_results?: number
            }
          | {
              query_text: string
              query_embedding: string
              similarity_threshold?: number
              max_results?: number
            }
          | {
              query_text: string
              query_embedding: string
              user_uuid: string
              similarity_threshold?: number
              max_results?: number
            }
        Returns: {
          id: string
          content_type: string
          emotion: string
          response_text: string
          confidence_score: number
          similarity_score: number
          metadata: Json
        }[]
      }
      update_google_api_key: {
        Args: { api_key: string }
        Returns: undefined
      }
      update_setting: {
        Args:
          | Record<PropertyKey, never>
          | { setting_key: string; setting_value: string }
        Returns: undefined
      }
      update_single_user_setting: {
        Args: { setting_key: string; setting_value: string }
        Returns: undefined
      }
      update_user_setting: {
        Args: { setting_key: string; setting_value: string }
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
