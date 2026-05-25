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
      blessings: {
        Row: {
          content: string
          created_at: string
          event_token: string
          id: string
          name: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          event_token: string
          id?: string
          name?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          event_token?: string
          id?: string
          name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          album_cover_url: string | null
          album_description: string | null
          album_publish_time: string | null
          album_title: string | null
          calendar_type: Database["public"]["Enums"]["calendar_type"]
          country_code: string | null
          cover_url: string | null
          created_at: string
          custom_publish_date: string | null
          custom_publish_delay: number | null
          custom_publish_time: string | null
          description: string | null
          enable_video: boolean
          end_at: string | null
          expected_guests: number
          invite_button_text: string | null
          is_album_published: boolean | null
          is_hidden: boolean
          is_private: boolean
          max_shots: number
          owner_id: string | null
          password: string | null
          password_hash: string | null
          published_at: string | null
          share_method: string | null
          show_header: boolean | null
          sign_in_method: string
          start_at: string | null
          title: string
          token: string
          welcome_text: string | null
          welcome_title: string | null
        }
        Insert: {
          album_cover_url?: string | null
          album_description?: string | null
          album_publish_time?: string | null
          album_title?: string | null
          calendar_type?: Database["public"]["Enums"]["calendar_type"]
          country_code?: string | null
          cover_url?: string | null
          created_at?: string
          custom_publish_date?: string | null
          custom_publish_delay?: number | null
          custom_publish_time?: string | null
          description?: string | null
          enable_video?: boolean
          end_at?: string | null
          expected_guests?: number
          invite_button_text?: string | null
          is_album_published?: boolean | null
          is_hidden?: boolean
          is_private?: boolean
          max_shots?: number
          owner_id?: string | null
          password?: string | null
          password_hash?: string | null
          published_at?: string | null
          share_method?: string | null
          show_header?: boolean | null
          sign_in_method?: string
          start_at?: string | null
          title: string
          token: string
          welcome_text?: string | null
          welcome_title?: string | null
        }
        Update: {
          album_cover_url?: string | null
          album_description?: string | null
          album_publish_time?: string | null
          album_title?: string | null
          calendar_type?: Database["public"]["Enums"]["calendar_type"]
          country_code?: string | null
          cover_url?: string | null
          created_at?: string
          custom_publish_date?: string | null
          custom_publish_delay?: number | null
          custom_publish_time?: string | null
          description?: string | null
          enable_video?: boolean
          end_at?: string | null
          expected_guests?: number
          invite_button_text?: string | null
          is_album_published?: boolean | null
          is_hidden?: boolean
          is_private?: boolean
          max_shots?: number
          owner_id?: string | null
          password?: string | null
          password_hash?: string | null
          published_at?: string | null
          share_method?: string | null
          show_header?: boolean | null
          sign_in_method?: string
          start_at?: string | null
          title?: string
          token?: string
          welcome_text?: string | null
          welcome_title?: string | null
        }
        Relationships: []
      }
      media_submissions: {
        Row: {
          created_at: string
          event_token: string
          file_name: string
          file_path: string
          id: string
          media_type: string
          metadata: Json | null
          participant_id: string | null
          thumbnail_path: string | null
        }
        Insert: {
          created_at?: string
          event_token: string
          file_name: string
          file_path: string
          id?: string
          media_type: string
          metadata?: Json | null
          participant_id?: string | null
          thumbnail_path?: string | null
        }
        Update: {
          created_at?: string
          event_token?: string
          file_name?: string
          file_path?: string
          id?: string
          media_type?: string
          metadata?: Json | null
          participant_id?: string | null
          thumbnail_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_submissions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          consent: boolean
          country_code: string | null
          created_at: string
          email: string | null
          event_token: string
          id: string
          method: string
          name: string | null
          phone: string | null
          user_id: string | null
        }
        Insert: {
          consent?: boolean
          country_code?: string | null
          created_at?: string
          email?: string | null
          event_token: string
          id?: string
          method: string
          name?: string | null
          phone?: string | null
          user_id?: string | null
        }
        Update: {
          consent?: boolean
          country_code?: string | null
          created_at?: string
          email?: string | null
          event_token?: string
          id?: string
          method?: string
          name?: string | null
          phone?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          agreed_terms_at: string | null
          birthdate: string | null
          country: string | null
          country_code: string | null
          created_at: string
          display_name: string | null
          gender: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          agreed_terms_at?: string | null
          birthdate?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          display_name?: string | null
          gender?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          agreed_terms_at?: string | null
          birthdate?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          display_name?: string | null
          gender?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
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
      can_access_album: {
        Args: { event_token_param: string; user_id_param?: string }
        Returns: boolean
      }
      get_my_participant_record: {
        Args: { event_token_param: string }
        Returns: {
          consent: boolean
          country_code: string
          created_at: string
          email: string
          id: string
          method: string
          name: string
          phone: string
        }[]
      }
      get_owner_participant_data: {
        Args: { event_token_param: string; owner_user_id: string }
        Returns: {
          consent: boolean
          country_code: string
          created_at: string
          email: string
          id: string
          method: string
          name: string
          phone: string
          user_id: string
        }[]
      }
      get_participant_by_name: {
        Args: { event_token_param: string; participant_name: string }
        Returns: {
          id: string
          name: string
        }[]
      }
      get_public_event_info: {
        Args: { event_token: string }
        Returns: {
          album_cover_url: string
          album_description: string
          album_title: string
          cover_url: string
          description: string
          enable_video: boolean
          end_at: string
          invite_button_text: string
          is_album_published: boolean
          is_private: boolean
          max_shots: number
          share_method: string
          show_header: boolean
          sign_in_method: string
          start_at: string
          title: string
          token: string
          welcome_text: string
          welcome_title: string
        }[]
      }
      get_public_participant_data: {
        Args: { event_token_param: string }
        Returns: {
          created_at: string
          id: string
          name: string
        }[]
      }
      grant_album_access: {
        Args: { event_token_param: string; provided_password: string }
        Returns: {
          access_granted: boolean
          expires_at: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_event_owner: {
        Args: { event_token: string; user_id: string }
        Returns: boolean
      }
      is_event_public_album: {
        Args: { event_token_param: string }
        Returns: boolean
      }
      is_event_visible: { Args: { event_token: string }; Returns: boolean }
      is_user_event_owner: {
        Args: { event_token: string; user_id: string }
        Returns: boolean
      }
      is_user_participant: {
        Args: { event_token_param: string; user_id_param: string }
        Returns: boolean
      }
      user_owns_event: {
        Args: { event_token_param: string; user_id_param: string }
        Returns: boolean
      }
      validate_event_password: {
        Args: { event_token: string; provided_password: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      calendar_type: "gregorian" | "hijri"
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
      calendar_type: ["gregorian", "hijri"],
    },
  },
} as const
