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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activities: {
        Row: {
          category: string | null
          complexity: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          instructions: string | null
          organization_id: string
          required_tools: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          complexity?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          instructions?: string | null
          organization_id: string
          required_tools?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          complexity?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          instructions?: string | null
          organization_id?: string
          required_tools?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_recommendations: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          created_by: string | null
          id: string
          is_custom: boolean | null
          organization_id: string
          reason: string | null
          recommended_activity_id: string | null
          recommended_public_activity_id: string | null
          team_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_custom?: boolean | null
          organization_id: string
          reason?: string | null
          recommended_activity_id?: string | null
          recommended_public_activity_id?: string | null
          team_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_custom?: boolean | null
          organization_id?: string
          reason?: string | null
          recommended_activity_id?: string | null
          recommended_public_activity_id?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_recommendations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_recommendations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_recommendations_recommended_activity_id_fkey"
            columns: ["recommended_activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_recommendations_recommended_public_activity_id_fkey"
            columns: ["recommended_public_activity_id"]
            isOneToOne: false
            referencedRelation: "public_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_recommendations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          event_data: Json | null
          event_type: string
          id: string
          organization_id: string
          team_id: string | null
          timestamp: string | null
          user_id: string
        }
        Insert: {
          event_data?: Json | null
          event_type: string
          id?: string
          organization_id: string
          team_id?: string | null
          timestamp?: string | null
          user_id: string
        }
        Update: {
          event_data?: Json | null
          event_type?: string
          id?: string
          organization_id?: string
          team_id?: string | null
          timestamp?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      customization_jobs: {
        Row: {
          ai_model_used: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string
          error_message: string | null
          id: string
          input_context: Json
          job_type: Database["public"]["Enums"]["job_type"]
          organization_id: string
          processing_time_ms: number | null
          result_data: Json | null
          source_activity_id: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          team_id: string
          tokens_used: number | null
        }
        Insert: {
          ai_model_used?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          error_message?: string | null
          id?: string
          input_context: Json
          job_type: Database["public"]["Enums"]["job_type"]
          organization_id: string
          processing_time_ms?: number | null
          result_data?: Json | null
          source_activity_id?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          team_id: string
          tokens_used?: number | null
        }
        Update: {
          ai_model_used?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          error_message?: string | null
          id?: string
          input_context?: Json
          job_type?: Database["public"]["Enums"]["job_type"]
          organization_id?: string
          processing_time_ms?: number | null
          result_data?: Json | null
          source_activity_id?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          team_id?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customization_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customization_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customization_jobs_source_activity_id_fkey"
            columns: ["source_activity_id"]
            isOneToOne: false
            referencedRelation: "public_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customization_jobs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      customized_activities: {
        Row: {
          category: string | null
          complexity: string | null
          created_at: string | null
          created_by: string
          customization_notes: string | null
          customization_type: Database["public"]["Enums"]["customization_type"]
          description: string | null
          duration_minutes: number | null
          expires_at: string | null
          generation_batch_id: string | null
          id: string
          instructions: string | null
          job_id: string | null
          organization_id: string
          required_tools: string[] | null
          scheduled_event_id: string | null
          source_public_activity_id: string | null
          status: Database["public"]["Enums"]["activity_status"] | null
          suggestion_number: number | null
          team_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          complexity?: string | null
          created_at?: string | null
          created_by: string
          customization_notes?: string | null
          customization_type: Database["public"]["Enums"]["customization_type"]
          description?: string | null
          duration_minutes?: number | null
          expires_at?: string | null
          generation_batch_id?: string | null
          id?: string
          instructions?: string | null
          job_id?: string | null
          organization_id: string
          required_tools?: string[] | null
          scheduled_event_id?: string | null
          source_public_activity_id?: string | null
          status?: Database["public"]["Enums"]["activity_status"] | null
          suggestion_number?: number | null
          team_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          complexity?: string | null
          created_at?: string | null
          created_by?: string
          customization_notes?: string | null
          customization_type?: Database["public"]["Enums"]["customization_type"]
          description?: string | null
          duration_minutes?: number | null
          expires_at?: string | null
          generation_batch_id?: string | null
          id?: string
          instructions?: string | null
          job_id?: string | null
          organization_id?: string
          required_tools?: string[] | null
          scheduled_event_id?: string | null
          source_public_activity_id?: string | null
          status?: Database["public"]["Enums"]["activity_status"] | null
          suggestion_number?: number | null
          team_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customized_activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customized_activities_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "customization_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customized_activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customized_activities_scheduled_event_id_fkey"
            columns: ["scheduled_event_id"]
            isOneToOne: false
            referencedRelation: "scheduled_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customized_activities_source_public_activity_id_fkey"
            columns: ["source_public_activity_id"]
            isOneToOne: false
            referencedRelation: "public_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customized_activities_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          attended: boolean
          comments: string | null
          event_id: string
          id: string
          organization_id: string
          rating: number
          submitted_at: string | null
          team_id: string
          user_id: string
        }
        Insert: {
          attended: boolean
          comments?: string | null
          event_id: string
          id?: string
          organization_id: string
          rating: number
          submitted_at?: string | null
          team_id: string
          user_id: string
        }
        Update: {
          attended?: boolean
          comments?: string | null
          event_id?: string
          id?: string
          organization_id?: string
          rating?: number
          submitted_at?: string | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "scheduled_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          settings: Json | null
          slug: string
          subscription_plan: string | null
          subscription_status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          settings?: Json | null
          slug: string
          subscription_plan?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          settings?: Json | null
          slug?: string
          subscription_plan?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      public_activities: {
        Row: {
          category: string
          complexity: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          instructions: string | null
          is_active: boolean | null
          required_tools: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          complexity?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          required_tools?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          complexity?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          required_tools?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      scheduled_events: {
        Row: {
          activity_id: string | null
          calendar_link: string | null
          created_at: string | null
          created_by: string
          description: string | null
          duration_minutes: number | null
          id: string
          organization_id: string
          public_activity_id: string | null
          scheduled_date: string
          status: string | null
          team_id: string
          title: string
          updated_at: string | null
          zoom_meeting_url: string | null
        }
        Insert: {
          activity_id?: string | null
          calendar_link?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          organization_id: string
          public_activity_id?: string | null
          scheduled_date: string
          status?: string | null
          team_id: string
          title: string
          updated_at?: string | null
          zoom_meeting_url?: string | null
        }
        Update: {
          activity_id?: string | null
          calendar_link?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          organization_id?: string
          public_activity_id?: string | null
          scheduled_date?: string
          status?: string | null
          team_id?: string
          title?: string
          updated_at?: string | null
          zoom_meeting_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_events_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_events_public_activity_id_fkey"
            columns: ["public_activity_id"]
            isOneToOne: false
            referencedRelation: "public_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_email: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          monthly_price_usd: number | null
          organization_id: string
          plan_type: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          team_count_tier: string | null
          updated_at: string | null
        }
        Insert: {
          billing_email?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          monthly_price_usd?: number | null
          organization_id: string
          plan_type: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          team_count_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_email?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          monthly_price_usd?: number | null
          organization_id?: string
          plan_type?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          team_count_tier?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string | null
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["user_role"]
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      team_profiles: {
        Row: {
          created_at: string | null
          id: string
          industry_sector: string | null
          last_updated_by: string | null
          member_responsibilities: string | null
          organization_id: string
          past_activities_summary: string | null
          preferences: Json | null
          successful_activity_patterns: Json | null
          team_id: string
          team_role_description: string | null
          team_size: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          industry_sector?: string | null
          last_updated_by?: string | null
          member_responsibilities?: string | null
          organization_id: string
          past_activities_summary?: string | null
          preferences?: Json | null
          successful_activity_patterns?: Json | null
          team_id: string
          team_role_description?: string | null
          team_size?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          industry_sector?: string | null
          last_updated_by?: string | null
          member_responsibilities?: string | null
          organization_id?: string
          past_activities_summary?: string | null
          preferences?: Json | null
          successful_activity_patterns?: Json | null
          team_id?: string
          team_role_description?: string | null
          team_size?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_profiles_last_updated_by_fkey"
            columns: ["last_updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      uploaded_materials: {
        Row: {
          content_summary: string | null
          created_at: string | null
          extracted_text: string | null
          file_name: string
          file_size_bytes: number
          file_type: string
          file_url: string
          id: string
          organization_id: string
          team_id: string
          uploaded_by: string
        }
        Insert: {
          content_summary?: string | null
          created_at?: string | null
          extracted_text?: string | null
          file_name: string
          file_size_bytes: number
          file_type: string
          file_url: string
          id?: string
          organization_id: string
          team_id: string
          uploaded_by: string
        }
        Update: {
          content_summary?: string | null
          created_at?: string | null
          extracted_text?: string | null
          file_name?: string
          file_size_bytes?: number
          file_type?: string
          file_url?: string
          id?: string
          organization_id?: string
          team_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploaded_materials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploaded_materials_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploaded_materials_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_quotas: {
        Row: {
          created_at: string | null
          custom_generations_limit: number | null
          custom_generations_used: number | null
          id: string
          last_reset_at: string | null
          organization_id: string
          public_customizations_limit: number | null
          public_customizations_used: number | null
          quota_period_end: string | null
          quota_period_start: string | null
          requires_verification: boolean | null
          trust_score: number | null
          updated_at: string | null
          verification_type: string | null
        }
        Insert: {
          created_at?: string | null
          custom_generations_limit?: number | null
          custom_generations_used?: number | null
          id?: string
          last_reset_at?: string | null
          organization_id: string
          public_customizations_limit?: number | null
          public_customizations_used?: number | null
          quota_period_end?: string | null
          quota_period_start?: string | null
          requires_verification?: boolean | null
          trust_score?: number | null
          updated_at?: string | null
          verification_type?: string | null
        }
        Update: {
          created_at?: string | null
          custom_generations_limit?: number | null
          custom_generations_used?: number | null
          id?: string
          last_reset_at?: string | null
          organization_id?: string
          public_customizations_limit?: number | null
          public_customizations_used?: number | null
          quota_period_end?: string | null
          quota_period_start?: string | null
          requires_verification?: boolean | null
          trust_score?: number | null
          updated_at?: string | null
          verification_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_quotas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          clerk_user_id: string
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          clerk_user_id: string
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          clerk_user_id?: string
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_trust_score: { Args: { org_id: string }; Returns: number }
      check_quota_available: {
        Args: { org_id: string; quota_type: string }
        Returns: boolean
      }
      current_user_id: { Args: never; Returns: string }
      get_user_managed_teams: {
        Args: { user_uuid: string }
        Returns: {
          team_id: string
        }[]
      }
      get_user_role_in_team: {
        Args: { team_uuid: string; user_uuid: string }
        Returns: string
      }
      is_user_admin_in_org: {
        Args: { org_uuid: string; user_uuid: string }
        Returns: boolean
      }
      is_user_manager_of_team: {
        Args: { team_uuid: string; user_uuid: string }
        Returns: boolean
      }
      reset_monthly_quotas: { Args: never; Returns: undefined }
    }
    Enums: {
      activity_status: "suggested" | "saved" | "scheduled" | "expired"
      customization_type: "public_customized" | "custom_generated"
      job_status: "pending" | "processing" | "completed" | "failed"
      job_type: "public_customization" | "custom_generation"
      user_role: "member" | "manager" | "admin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_status: ["suggested", "saved", "scheduled", "expired"],
      customization_type: ["public_customized", "custom_generated"],
      job_status: ["pending", "processing", "completed", "failed"],
      job_type: ["public_customization", "custom_generation"],
      user_role: ["member", "manager", "admin"],
    },
  },
} as const
