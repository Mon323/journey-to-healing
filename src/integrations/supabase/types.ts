export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      goals: {
        Row: {
          admin_feedback: string | null
          by_when: string | null
          created_at: string
          goal_text: string
          how_text: string | null
          id: string
          status: Database["public"]["Enums"]["submission_status"]
          updated_at: string
          user_id: string
          why_text: string | null
        }
        Insert: {
          admin_feedback?: string | null
          by_when?: string | null
          created_at?: string
          goal_text: string
          how_text?: string | null
          id?: string
          status?: Database["public"]["Enums"]["submission_status"]
          updated_at?: string
          user_id: string
          why_text?: string | null
        }
        Update: {
          admin_feedback?: string | null
          by_when?: string | null
          created_at?: string
          goal_text?: string
          how_text?: string | null
          id?: string
          status?: Database["public"]["Enums"]["submission_status"]
          updated_at?: string
          user_id?: string
          why_text?: string | null
        }
        Relationships: []
      }
      gratitude_entries: {
        Row: {
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      overts: {
        Row: {
          admin_feedback: string | null
          created_at: string
          emotions: string | null
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["submission_status"]
          title: string
          updated_at: string
          user_id: string
          what_happened: string | null
          who_involved: string | null
        }
        Insert: {
          admin_feedback?: string | null
          created_at?: string
          emotions?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          title: string
          updated_at?: string
          user_id: string
          what_happened?: string | null
          who_involved?: string | null
        }
        Update: {
          admin_feedback?: string | null
          created_at?: string
          emotions?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          title?: string
          updated_at?: string
          user_id?: string
          what_happened?: string | null
          who_involved?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      stage_submissions: {
        Row: {
          admin_feedback: string | null
          audio_path: string | null
          created_at: string
          id: string
          question_index: number
          question_text: string | null
          stage: Database["public"]["Enums"]["stage_key"]
          status: Database["public"]["Enums"]["submission_status"]
          text_answer: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_feedback?: string | null
          audio_path?: string | null
          created_at?: string
          id?: string
          question_index?: number
          question_text?: string | null
          stage: Database["public"]["Enums"]["stage_key"]
          status?: Database["public"]["Enums"]["submission_status"]
          text_answer?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_feedback?: string | null
          audio_path?: string | null
          created_at?: string
          id?: string
          question_index?: number
          question_text?: string | null
          stage?: Database["public"]["Enums"]["stage_key"]
          status?: Database["public"]["Enums"]["submission_status"]
          text_answer?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          current_stage: Database["public"]["Enums"]["stage_key"]
          updated_at: string
          user_id: string
        }
        Insert: {
          current_stage?: Database["public"]["Enums"]["stage_key"]
          updated_at?: string
          user_id: string
        }
        Update: {
          current_stage?: Database["public"]["Enums"]["stage_key"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      account_status: "pending" | "approved" | "rejected"
      app_role: "admin" | "user"
      stage_key:
        | "account_approval"
        | "training_videos"
        | "audio_lessons"
        | "knowledge_test"
        | "voice_answers"
        | "overts"
        | "goals"
        | "gratitude"
        | "completed"
      submission_status: "pending" | "approved" | "rejected"
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
    Enums: {
      account_status: ["pending", "approved", "rejected"],
      app_role: ["admin", "user"],
      stage_key: [
        "account_approval",
        "training_videos",
        "audio_lessons",
        "knowledge_test",
        "voice_answers",
        "overts",
        "goals",
        "gratitude",
        "completed",
      ],
      submission_status: ["pending", "approved", "rejected"],
    },
  },
} as const
