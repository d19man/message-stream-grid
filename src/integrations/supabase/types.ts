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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          admin_id: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          subscription_active: boolean | null
          subscription_end: string | null
          subscription_start: string | null
          subscription_type:
            | Database["public"]["Enums"]["subscription_type"]
            | null
          updated_at: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          subscription_active?: boolean | null
          subscription_end?: string | null
          subscription_start?: string | null
          subscription_type?:
            | Database["public"]["Enums"]["subscription_type"]
            | null
          updated_at?: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          subscription_active?: boolean | null
          subscription_end?: string | null
          subscription_start?: string | null
          subscription_type?:
            | Database["public"]["Enums"]["subscription_type"]
            | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system_role: boolean | null
          name: string
          permissions: Database["public"]["Enums"]["app_permission"][]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system_role?: boolean | null
          name: string
          permissions?: Database["public"]["Enums"]["app_permission"][]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system_role?: boolean | null
          name?: string
          permissions?: Database["public"]["Enums"]["app_permission"][]
          updated_at?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          admin_id: string | null
          created_at: string
          created_by: string | null
          id: string
          last_seen: string | null
          name: string
          phone: string | null
          pool: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          last_seen?: string | null
          name: string
          phone?: string | null
          pool: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          last_seen?: string | null
          name?: string
          phone?: string | null
          pool?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_api_keys: {
        Row: {
          created_at: string
          encrypted_key: string
          id: string
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          encrypted_key: string
          id?: string
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          encrypted_key?: string
          id?: string
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_contacts: {
        Row: {
          created_at: string
          id: string
          is_business: boolean | null
          last_seen: string | null
          name: string | null
          phone_number: string
          profile_picture_url: string | null
          session_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_business?: boolean | null
          last_seen?: string | null
          name?: string | null
          phone_number: string
          profile_picture_url?: string | null
          session_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_business?: boolean | null
          last_seen?: string | null
          name?: string | null
          phone_number?: string
          profile_picture_url?: string | null
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_contacts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          created_at: string
          from_number: string
          id: string
          is_from_me: boolean
          media_url: string | null
          message_id: string | null
          message_text: string | null
          message_type: string
          session_id: string
          status: string | null
          timestamp: string
          to_number: string
        }
        Insert: {
          created_at?: string
          from_number: string
          id?: string
          is_from_me?: boolean
          media_url?: string | null
          message_id?: string | null
          message_text?: string | null
          message_type?: string
          session_id: string
          status?: string | null
          timestamp: string
          to_number: string
        }
        Update: {
          created_at?: string
          from_number?: string
          id?: string
          is_from_me?: boolean
          media_url?: string | null
          message_id?: string | null
          message_text?: string | null
          message_type?: string
          session_id?: string
          status?: string | null
          timestamp?: string
          to_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_sessions: {
        Row: {
          admin_id: string | null
          auth_state: Json | null
          created_at: string
          id: string
          last_seen: string | null
          phone_number: string | null
          qr_code: string | null
          session_name: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_id?: string | null
          auth_state?: Json | null
          created_at?: string
          id?: string
          last_seen?: string | null
          phone_number?: string | null
          qr_code?: string | null
          session_name: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_id?: string | null
          auth_state?: Json | null
          created_at?: string
          id?: string
          last_seen?: string | null
          phone_number?: string | null
          qr_code?: string | null
          session_name?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_sessions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_admin_profile: {
        Args: { admin_user_id: string }
        Returns: boolean
      }
      get_current_user_admin_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_permissions: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["app_permission"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_subscription_active: {
        Args: { user_id: string }
        Returns: boolean
      }
      user_has_permission: {
        Args: {
          permission: Database["public"]["Enums"]["app_permission"]
          user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_permission:
        | "manage:user"
        | "view:user"
        | "manage:role"
        | "view:role"
        | "manage:session"
        | "view:session"
        | "view:pool-session"
        | "create:pool-session"
        | "transfer:pool-session"
        | "delete:pool-session"
        | "purge:pool-session"
        | "manage:inbox:crm"
        | "view:inbox:crm"
        | "manage:inbox:blaster"
        | "view:inbox:blaster"
        | "manage:inbox:warmup"
        | "view:inbox:warmup"
        | "manage:broadcast"
        | "view:broadcast"
        | "start:blast"
        | "stop:blast"
        | "manage:template"
        | "view:template"
        | "manage:ai"
        | "view:ai"
      app_role: "superadmin" | "admin" | "user" | "crm" | "blaster" | "warmup"
      subscription_type:
        | "lifetime"
        | "trial_1_day"
        | "trial_3_days"
        | "trial_5_days"
        | "1_month"
        | "2_months"
        | "3_months"
        | "6_months"
        | "1_year"
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
      app_permission: [
        "manage:user",
        "view:user",
        "manage:role",
        "view:role",
        "manage:session",
        "view:session",
        "view:pool-session",
        "create:pool-session",
        "transfer:pool-session",
        "delete:pool-session",
        "purge:pool-session",
        "manage:inbox:crm",
        "view:inbox:crm",
        "manage:inbox:blaster",
        "view:inbox:blaster",
        "manage:inbox:warmup",
        "view:inbox:warmup",
        "manage:broadcast",
        "view:broadcast",
        "start:blast",
        "stop:blast",
        "manage:template",
        "view:template",
        "manage:ai",
        "view:ai",
      ],
      app_role: ["superadmin", "admin", "user", "crm", "blaster", "warmup"],
      subscription_type: [
        "lifetime",
        "trial_1_day",
        "trial_3_days",
        "trial_5_days",
        "1_month",
        "2_months",
        "3_months",
        "6_months",
        "1_year",
      ],
    },
  },
} as const
