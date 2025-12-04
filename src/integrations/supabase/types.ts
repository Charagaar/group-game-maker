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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      game_categories: {
        Row: {
          created_at: string
          difficulty: string
          display_order: number
          id: string
          name: string
          updated_at: string
          words: string[]
        }
        Insert: {
          created_at?: string
          difficulty: string
          display_order: number
          id?: string
          name: string
          updated_at?: string
          words: string[]
        }
        Update: {
          created_at?: string
          difficulty?: string
          display_order?: number
          id?: string
          name?: string
          updated_at?: string
          words?: string[]
        }
        Relationships: []
      }
      game_sessions: {
        Row: {
          app_version: string | null
          categories_solved: number | null
          client_id: string | null
          completed_at: string | null
          game_won: boolean | null
          id: string
          lives_lost: number | null
          puzzle_id: string | null
          session_id: string
          started_at: string
        }
        Insert: {
          app_version?: string | null
          categories_solved?: number | null
          client_id?: string | null
          completed_at?: string | null
          game_won?: boolean | null
          id?: string
          lives_lost?: number | null
          puzzle_id?: string | null
          session_id: string
          started_at?: string
        }
        Update: {
          app_version?: string | null
          categories_solved?: number | null
          client_id?: string | null
          completed_at?: string | null
          game_won?: boolean | null
          id?: string
          lives_lost?: number | null
          puzzle_id?: string | null
          session_id?: string
          started_at?: string
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
      game_metrics_by_client_puzzle: {
        Row: {
          avg_categories_solved: number | null
          avg_lives_lost: number | null
          client_id: string | null
          first_seen: string | null
          incomplete: number | null
          last_seen: string | null
          losses: number | null
          puzzle_id: string | null
          sessions: number | null
          win_rate: number | null
          wins: number | null
        }
        Insert: {
          avg_categories_solved?: number | null
          avg_lives_lost?: number | null
          client_id?: string | null
          first_seen?: string | null
          incomplete?: number | null
          last_seen?: string | null
          losses?: number | null
          puzzle_id?: string | null
          sessions?: number | null
          win_rate?: number | null
          wins?: number | null
        }
        Update: {
          avg_categories_solved?: number | null
          avg_lives_lost?: number | null
          client_id?: string | null
          first_seen?: string | null
          incomplete?: number | null
          last_seen?: string | null
          losses?: number | null
          puzzle_id?: string | null
          sessions?: number | null
          win_rate?: number | null
          wins?: number | null
        }
        Relationships: []
      }
      game_metrics_by_client: {
        Row: {
          avg_categories_solved: number | null
          avg_lives_lost: number | null
          client_id: string | null
          first_seen: string | null
          incomplete: number | null
          last_seen: string | null
          sessions: number | null
          losses: number | null
          win_rate: number | null
          wins: number | null
        }
        Insert: {
          avg_categories_solved?: number | null
          avg_lives_lost?: number | null
          client_id?: string | null
          first_seen?: string | null
          incomplete?: number | null
          last_seen?: string | null
          sessions?: number | null
          losses?: number | null
          win_rate?: number | null
          wins?: number | null
        }
        Update: {
          avg_categories_solved?: number | null
          avg_lives_lost?: number | null
          client_id?: string | null
          first_seen?: string | null
          incomplete?: number | null
          last_seen?: string | null
          sessions?: number | null
          losses?: number | null
          win_rate?: number | null
          wins?: number | null
        }
        Relationships: []
      }
      game_metrics_daily_by_puzzle: {
        Row: {
          avg_categories_solved: number | null
          avg_lives_lost: number | null
          day: string | null
          incomplete: number | null
          losses: number | null
          puzzle_id: string | null
          sessions: number | null
          unique_clients: number | null
          wins: number | null
        }
        Insert: {
          avg_categories_solved?: number | null
          avg_lives_lost?: number | null
          day?: string | null
          incomplete?: number | null
          losses?: number | null
          puzzle_id?: string | null
          sessions?: number | null
          unique_clients?: number | null
          wins?: number | null
        }
        Update: {
          avg_categories_solved?: number | null
          avg_lives_lost?: number | null
          day?: string | null
          incomplete?: number | null
          losses?: number | null
          puzzle_id?: string | null
          sessions?: number | null
          unique_clients?: number | null
          wins?: number | null
        }
        Relationships: []
      }
      game_metrics_daily: {
        Row: {
          avg_categories_solved: number | null
          avg_lives_lost: number | null
          day: string | null
          incomplete: number | null
          losses: number | null
          sessions: number | null
          unique_clients: number | null
          wins: number | null
        }
        Insert: {
          avg_categories_solved?: number | null
          avg_lives_lost?: number | null
          day?: string | null
          incomplete?: number | null
          losses?: number | null
          sessions?: number | null
          unique_clients?: number | null
          wins?: number | null
        }
        Update: {
          avg_categories_solved?: number | null
          avg_lives_lost?: number | null
          day?: string | null
          incomplete?: number | null
          losses?: number | null
          sessions?: number | null
          unique_clients?: number | null
          wins?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      grant_admin_by_user_id: { Args: { _user_id: string }; Returns: boolean }
      grant_admin_to_user: { Args: { _email: string }; Returns: boolean }
      has_any_admin: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
