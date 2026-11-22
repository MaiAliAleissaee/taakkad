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
      ai_usage_budgets: {
        Row: {
          bucket: string
          hits: number
          recent: string[]
          usage_day: string
        }
        Insert: {
          bucket: string
          hits?: number
          recent?: string[]
          usage_day: string
        }
        Update: {
          bucket?: string
          hits?: number
          recent?: string[]
          usage_day?: string
        }
        Relationships: []
      }
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
          demo_registration: boolean
          demo_under_review: boolean
          documents: Json
          id: string
          organization_id: string
          owner_id: string
          payload: Json
          revision: number
          status: string
          status_updated_at: string
          submitted_at: string
        }
        Insert: {
          audit?: Json
          correction_note?: string
          demo_registration?: boolean
          demo_under_review?: boolean
          documents?: Json
          id?: string
          organization_id: string
          owner_id: string
          payload: Json
          revision?: number
          status?: string
          status_updated_at?: string
          submitted_at?: string
        }
        Update: {
          audit?: Json
          correction_note?: string
          demo_registration?: boolean
          demo_under_review?: boolean
          documents?: Json
          id?: string
          organization_id?: string
          owner_id?: string
          payload?: Json
          revision?: number
          status?: string
          status_updated_at?: string
          submitted_at?: string
        }
        Relationships: []
      }
      organization_demo_registry: {
        Row: {
          application_id: string
          approved: boolean
          channels: Json
          name: Json
          simulated: boolean
        }
        Insert: {
          application_id: string
          approved?: boolean
          channels: Json
          name: Json
          simulated?: boolean
        }
        Update: {
          application_id?: string
          approved?: boolean
          channels?: Json
          name?: Json
          simulated?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "organization_demo_registry_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "organization_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_demo_tracking: {
        Row: {
          application_id: string | null
          code: string
        }
        Insert: {
          application_id?: string | null
          code: string
        }
        Update: {
          application_id?: string | null
          code?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_demo_tracking_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "organization_applications"
            referencedColumns: ["id"]
          },
        ]
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
      security_report_number_counters: {
        Row: {
          last_number: number
          report_year: number
        }
        Insert: {
          last_number?: number
          report_year: number
        }
        Update: {
          last_number?: number
          report_year?: number
        }
        Relationships: []
      }
      security_report_number_ledger: {
        Row: {
          report_id: string
          report_sequence: number
          report_year: number
        }
        Insert: {
          report_id: string
          report_sequence: number
          report_year: number
        }
        Update: {
          report_id?: string
          report_sequence?: number
          report_year?: number
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
      staff_login_identifiers: {
        Row: {
          staff_id: string
          user_id: string
        }
        Insert: {
          staff_id: string
          user_id: string
        }
        Update: {
          staff_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_login_identifiers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_password_setup_grants: {
        Row: {
          created_at: string
          expires_at: string
          token_hash: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          token_hash: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          token_hash?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_password_setup_grants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      allocate_demo_tracking: {
        Args: { application_uuid: string }
        Returns: string
      }
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
      flagged_ai_indicator_values: {
        Args: { candidate_indicators: Json; workspace_user?: string }
        Returns: string[]
      }
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
      read_demo_organization_status: {
        Args: { tracking_code: string }
        Returns: string
      }
      read_demo_organization_tracking: {
        Args: { tracking_code: string }
        Returns: Json
      }
      reserve_trust_ai_usage: {
        Args: { visitor_hash: string }
        Returns: boolean
      }
      review_demo_organization: {
        Args: {
          actor_id: string
          application_uuid: string
          decision: string
          decision_note: string
          expected_revision: number
        }
        Returns: undefined
      }
      submit_ai_security_report: {
        Args: { report_input: Json; workspace_user?: string }
        Returns: undefined
      }
      submit_demo_organization: {
        Args: { application_payload: Json }
        Returns: string
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
