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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      organization_application_grants: {
        Row: {
          application_id: string
          expires_at: string
          token_hash: string
        }
        Insert: {
          application_id: string
          expires_at: string
          token_hash: string
        }
        Update: {
          application_id?: string
          expires_at?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_application_grants_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "organization_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_applications: {
        Row: {
          audit: Json
          correction_note: string
          documents: Json
          id: string
          organization_id: string
          owner_id: string
          payload: Json
          revision: number
          status: string
          submitted_at: string
        }
        Insert: {
          audit?: Json
          correction_note?: string
          documents?: Json
          id?: string
          organization_id: string
          owner_id: string
          payload: Json
          revision?: number
          status?: string
          submitted_at?: string
        }
        Update: {
          audit?: Json
          correction_note?: string
          documents?: Json
          id?: string
          organization_id?: string
          owner_id?: string
          payload?: Json
          revision?: number
          status?: string
          submitted_at?: string
        }
        Relationships: []
      }
      organization_public_registry: {
        Row: {
          organization_id: string
          payload: Json
        }
        Insert: {
          organization_id: string
          payload: Json
        }
        Update: {
          organization_id?: string
          payload?: Json
        }
        Relationships: []
      }
      organization_request_limits: {
        Row: {
          bucket: string
          count: number
          started_at: string
        }
        Insert: {
          bucket: string
          count?: number
          started_at?: string
        }
        Update: {
          bucket?: string
          count?: number
          started_at?: string
        }
        Relationships: []
      }
      organization_tracking_credentials: {
        Row: {
          application_id: string
          attempts: number
          code_requested_at: string | null
          email: string
          last_code_at: string | null
          secret_hash: string
        }
        Insert: {
          application_id: string
          attempts?: number
          code_requested_at?: string | null
          email: string
          last_code_at?: string | null
          secret_hash: string
        }
        Update: {
          application_id?: string
          attempts?: number
          code_requested_at?: string | null
          email?: string
          last_code_at?: string | null
          secret_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_tracking_credentials_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "organization_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          display_name: string
          id: string
          preferences: Json
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string
          id: string
          preferences?: Json
        }
        Update: {
          avatar_url?: string | null
          display_name?: string
          id?: string
          preferences?: Json
        }
        Relationships: []
      }
      public_security_alerts: {
        Row: {
          content: Json
          id: string
          published_at: string
        }
        Insert: {
          content: Json
          id: string
          published_at: string
        }
        Update: {
          content?: Json
          id?: string
          published_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_security_alerts_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "security_bulletins"
            referencedColumns: ["id"]
          },
        ]
      }
      security_bulletin_audit: {
        Row: {
          action: string
          actor_id: string
          at: string
          bulletin_id: string
          id: string
          note: string
        }
        Insert: {
          action: string
          actor_id: string
          at?: string
          bulletin_id: string
          id?: string
          note: string
        }
        Update: {
          action?: string
          actor_id?: string
          at?: string
          bulletin_id?: string
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_bulletin_audit_bulletin_id_fkey"
            columns: ["bulletin_id"]
            isOneToOne: false
            referencedRelation: "security_bulletins"
            referencedColumns: ["id"]
          },
        ]
      }
      security_bulletins: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          author_id: string
          content: Json
          id: string
          published_at: string | null
          revision: number
          status: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          author_id: string
          content: Json
          id?: string
          published_at?: string | null
          revision?: number
          status?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          author_id?: string
          content?: Json
          id?: string
          published_at?: string | null
          revision?: number
          status?: string
        }
        Relationships: []
      }
      security_migrations: {
        Row: {
          id: string
          imported_at: string
          payload: Json
          user_id: string
        }
        Insert: {
          id: string
          imported_at?: string
          payload: Json
          user_id: string
        }
        Update: {
          id?: string
          imported_at?: string
          payload?: Json
          user_id?: string
        }
        Relationships: []
      }
      security_reports: {
        Row: {
          id: string
          input: Json
          received_at: string
          recipient: string | null
        }
        Insert: {
          id?: string
          input: Json
          received_at?: string
          recipient?: string | null
        }
        Update: {
          id?: string
          input?: Json
          received_at?: string
          recipient?: string | null
        }
        Relationships: []
      }
      security_templates: {
        Row: {
          id: string
          payload: Json
        }
        Insert: {
          id: string
          payload: Json
        }
        Update: {
          id?: string
          payload?: Json
        }
        Relationships: []
      }
      security_workspaces: {
        Row: {
          payload: Json
          revision: number
          user_id: string
        }
        Insert: {
          payload: Json
          revision?: number
          user_id: string
        }
        Update: {
          payload?: Json
          revision?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      attempt_application_code: {
        Args: { application_uuid: string }
        Returns: boolean
      }
      begin_application_code: {
        Args: { application_uuid: string }
        Returns: boolean
      }
      commit_organization_application: {
        Args: {
          actor_id: string
          application_id: string
          decision_note: string
          event_details: Json
          expected_revision: number
          next_documents: Json
          next_payload: Json
          next_status: string
          operation: string
        }
        Returns: string
      }
      create_tracked_application: {
        Args: {
          application_documents: Json
          application_payload: Json
          tracking_email: string
          tracking_hash: string
        }
        Returns: string
      }
      ensure_security_workspace: { Args: never; Returns: undefined }
      flagged_message_values: {
        Args: { candidate_values: string[]; workspace_user?: string }
        Returns: string[]
      }
      has_organization_officer_access: { Args: never; Returns: boolean }
      has_security_access: { Args: never; Returns: boolean }
      import_security_snapshot: {
        Args: { migration_id: string; saved_payload: Json }
        Returns: undefined
      }
      manage_security_bulletin: {
        Args: {
          bulletin_id?: string
          decision_note?: string
          expected_revision?: number
          operation?: string
          privacy_reviewed?: boolean
          public_content?: Json
        }
        Returns: string
      }
      officer_is_application_contact: {
        Args: { application_uuid: string }
        Returns: boolean
      }
      organization_rate_limit: {
        Args: {
          bucket_key: string
          max_requests: number
          window_seconds: number
        }
        Returns: boolean
      }
      submit_security_report: {
        Args: { report_input: Json; workspace_user?: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "security_analyst"
        | "security_supervisor"
        | "organization_verification_officer"
        | "organization_administrator"
        | "public_visitor"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "security_analyst",
        "security_supervisor",
        "organization_verification_officer",
        "organization_administrator",
        "public_visitor",
      ],
    },
  },
} as const
