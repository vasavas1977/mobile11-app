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
      action_catalog: {
        Row: {
          action_type: string
          approval_roles: string[] | null
          category: string
          created_at: string
          description: string | null
          display_name: string
          id: string
          input_schema: Json
          is_enabled: boolean
          max_retries: number
          requires_approval: boolean
          timeout_seconds: number
          updated_at: string
        }
        Insert: {
          action_type: string
          approval_roles?: string[] | null
          category?: string
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          input_schema?: Json
          is_enabled?: boolean
          max_retries?: number
          requires_approval?: boolean
          timeout_seconds?: number
          updated_at?: string
        }
        Update: {
          action_type?: string
          approval_roles?: string[] | null
          category?: string
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          input_schema?: Json
          is_enabled?: boolean
          max_retries?: number
          requires_approval?: boolean
          timeout_seconds?: number
          updated_at?: string
        }
        Relationships: []
      }
      admin_activity_logs: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string
          description: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string
          description: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string
          description?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
        }
        Relationships: []
      }
      admin_permissions: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_edit: boolean | null
          can_view: boolean | null
          created_at: string | null
          id: string
          permission_area: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          permission_area: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          permission_area?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      affiliate_clicks: {
        Row: {
          affiliate_id: string
          clicked_at: string
          country: string | null
          device_type: string | null
          id: string
          ip_address: string | null
          link_id: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          affiliate_id: string
          clicked_at?: string
          country?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          link_id?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          affiliate_id?: string
          clicked_at?: string
          country?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          link_id?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_clicks_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_conversions: {
        Row: {
          affiliate_id: string
          approved_at: string | null
          approved_by: string | null
          commission_amount: number
          commission_rate: number
          commission_type: string
          converted_at: string
          customer_user_id: string | null
          id: string
          link_id: string | null
          order_amount: number
          order_id: string
          override_affiliate_id: string | null
          override_amount: number | null
          override_rate: number | null
          paid_at: string | null
          payout_id: string | null
          rejection_reason: string | null
          status: string
        }
        Insert: {
          affiliate_id: string
          approved_at?: string | null
          approved_by?: string | null
          commission_amount: number
          commission_rate: number
          commission_type: string
          converted_at?: string
          customer_user_id?: string | null
          id?: string
          link_id?: string | null
          order_amount: number
          order_id: string
          override_affiliate_id?: string | null
          override_amount?: number | null
          override_rate?: number | null
          paid_at?: string | null
          payout_id?: string | null
          rejection_reason?: string | null
          status?: string
        }
        Update: {
          affiliate_id?: string
          approved_at?: string | null
          approved_by?: string | null
          commission_amount?: number
          commission_rate?: number
          commission_type?: string
          converted_at?: string
          customer_user_id?: string | null
          id?: string
          link_id?: string | null
          order_amount?: number
          order_id?: string
          override_affiliate_id?: string | null
          override_amount?: number | null
          override_rate?: number | null
          paid_at?: string | null
          payout_id?: string | null
          rejection_reason?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_conversions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_conversions_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_conversions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_conversions_override_affiliate_id_fkey"
            columns: ["override_affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_links: {
        Row: {
          affiliate_id: string
          campaign_name: string | null
          click_count: number | null
          conversion_count: number | null
          created_at: string
          destination_url: string
          id: string
          is_active: boolean | null
          link_code: string
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          campaign_name?: string | null
          click_count?: number | null
          conversion_count?: number | null
          created_at?: string
          destination_url?: string
          id?: string
          is_active?: boolean | null
          link_code: string
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          campaign_name?: string | null
          click_count?: number | null
          conversion_count?: number | null
          created_at?: string
          destination_url?: string
          id?: string
          is_active?: boolean | null
          link_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_links_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_milestone_claims: {
        Row: {
          affiliate_id: string
          bonus_amount: number
          claimed_at: string
          id: string
          milestone_id: string
        }
        Insert: {
          affiliate_id: string
          bonus_amount: number
          claimed_at?: string
          id?: string
          milestone_id: string
        }
        Update: {
          affiliate_id?: string
          bonus_amount?: number
          claimed_at?: string
          id?: string
          milestone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_milestone_claims_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_milestone_claims_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "affiliate_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_milestones: {
        Row: {
          badge_icon: string | null
          bonus_amount: number
          created_at: string
          id: string
          is_active: boolean
          milestone_name: string
          sales_threshold: number
        }
        Insert: {
          badge_icon?: string | null
          bonus_amount: number
          created_at?: string
          id?: string
          is_active?: boolean
          milestone_name: string
          sales_threshold: number
        }
        Update: {
          badge_icon?: string | null
          bonus_amount?: number
          created_at?: string
          id?: string
          is_active?: boolean
          milestone_name?: string
          sales_threshold?: number
        }
        Relationships: []
      }
      affiliate_payouts: {
        Row: {
          admin_notes: string | null
          affiliate_id: string
          amount: number
          created_at: string
          currency: string
          id: string
          notes: string | null
          payment_details: Json | null
          payout_method: string
          processed_at: string | null
          processed_by: string | null
          reference_number: string | null
          requested_at: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          affiliate_id: string
          amount: number
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          payment_details?: Json | null
          payout_method: string
          processed_at?: string | null
          processed_by?: string | null
          reference_number?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          affiliate_id?: string
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          payment_details?: Json | null
          payout_method?: string
          processed_at?: string | null
          processed_by?: string | null
          reference_number?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_tier_config: {
        Row: {
          badge_color: string
          commission_rate: number
          created_at: string
          id: string
          max_sales: number | null
          min_sales: number
          override_rate: number
          tier_name: string
          tier_order: number
          updated_at: string
        }
        Insert: {
          badge_color?: string
          commission_rate?: number
          created_at?: string
          id?: string
          max_sales?: number | null
          min_sales?: number
          override_rate?: number
          tier_name: string
          tier_order?: number
          updated_at?: string
        }
        Update: {
          badge_color?: string
          commission_rate?: number
          created_at?: string
          id?: string
          max_sales?: number | null
          min_sales?: number
          override_rate?: number
          tier_name?: string
          tier_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      affiliates: {
        Row: {
          affiliate_code: string
          affiliate_type: string
          approved_at: string | null
          approved_by: string | null
          commission_rate: number
          commission_type: string
          company_name: string | null
          created_at: string
          current_volume_tier: string
          id: string
          loyalty_months: number
          loyalty_tier: string
          milestones_claimed: Json
          monthly_sales_count: number
          override_rate: number | null
          paid_earnings: number | null
          parent_affiliate_id: string | null
          payment_details: Json | null
          payment_method: string | null
          pending_earnings: number | null
          status: string
          tier_updated_at: string | null
          total_clicks: number | null
          total_conversions: number | null
          total_earnings: number | null
          total_lifetime_sales: number
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          affiliate_code: string
          affiliate_type?: string
          approved_at?: string | null
          approved_by?: string | null
          commission_rate?: number
          commission_type?: string
          company_name?: string | null
          created_at?: string
          current_volume_tier?: string
          id?: string
          loyalty_months?: number
          loyalty_tier?: string
          milestones_claimed?: Json
          monthly_sales_count?: number
          override_rate?: number | null
          paid_earnings?: number | null
          parent_affiliate_id?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          pending_earnings?: number | null
          status?: string
          tier_updated_at?: string | null
          total_clicks?: number | null
          total_conversions?: number | null
          total_earnings?: number | null
          total_lifetime_sales?: number
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          affiliate_code?: string
          affiliate_type?: string
          approved_at?: string | null
          approved_by?: string | null
          commission_rate?: number
          commission_type?: string
          company_name?: string | null
          created_at?: string
          current_volume_tier?: string
          id?: string
          loyalty_months?: number
          loyalty_tier?: string
          milestones_claimed?: Json
          monthly_sales_count?: number
          override_rate?: number | null
          paid_earnings?: number | null
          parent_affiliate_id?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          pending_earnings?: number | null
          status?: string
          tier_updated_at?: string | null
          total_clicks?: number | null
          total_conversions?: number | null
          total_earnings?: number | null
          total_lifetime_sales?: number
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliates_parent_affiliate_id_fkey"
            columns: ["parent_affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_metrics_daily: {
        Row: {
          agent_id: string
          avg_resolution_time_seconds: number | null
          avg_response_time_seconds: number | null
          conversations_handled: number
          conversations_resolved: number
          created_at: string
          customer_satisfaction_score: number | null
          date: string
          id: string
          messages_sent: number
        }
        Insert: {
          agent_id: string
          avg_resolution_time_seconds?: number | null
          avg_response_time_seconds?: number | null
          conversations_handled?: number
          conversations_resolved?: number
          created_at?: string
          customer_satisfaction_score?: number | null
          date?: string
          id?: string
          messages_sent?: number
        }
        Update: {
          agent_id?: string
          avg_resolution_time_seconds?: number | null
          avg_response_time_seconds?: number | null
          conversations_handled?: number
          conversations_resolved?: number
          created_at?: string
          customer_satisfaction_score?: number | null
          date?: string
          id?: string
          messages_sent?: number
        }
        Relationships: []
      }
      agent_status: {
        Row: {
          active_conversations: number
          id: string
          last_activity_at: string | null
          max_conversations: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_conversations?: number
          id?: string
          last_activity_at?: string | null
          max_conversations?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_conversations?: number
          id?: string
          last_activity_at?: string | null
          max_conversations?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_chat_config: {
        Row: {
          auto_respond: boolean
          confidence_threshold: number
          created_at: string
          enabled: boolean
          id: string
          max_ai_turns: number
          model: string
          system_prompt: string
          updated_at: string
        }
        Insert: {
          auto_respond?: boolean
          confidence_threshold?: number
          created_at?: string
          enabled?: boolean
          id?: string
          max_ai_turns?: number
          model?: string
          system_prompt?: string
          updated_at?: string
        }
        Update: {
          auto_respond?: boolean
          confidence_threshold?: number
          created_at?: string
          enabled?: boolean
          id?: string
          max_ai_turns?: number
          model?: string
          system_prompt?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_conversation_events: {
        Row: {
          channel: string | null
          clustered_at: string | null
          conversation_id: string
          created_at: string
          customer_id: string | null
          event_type: string
          id: string
          language: string | null
          message_id: string | null
          payload: Json | null
          processing_status: string
          scored_at: string | null
        }
        Insert: {
          channel?: string | null
          clustered_at?: string | null
          conversation_id: string
          created_at?: string
          customer_id?: string | null
          event_type: string
          id?: string
          language?: string | null
          message_id?: string | null
          payload?: Json | null
          processing_status?: string
          scored_at?: string | null
        }
        Update: {
          channel?: string | null
          clustered_at?: string | null
          conversation_id?: string
          created_at?: string
          customer_id?: string | null
          event_type?: string
          id?: string
          language?: string | null
          message_id?: string | null
          payload?: Json | null
          processing_status?: string
          scored_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversation_events_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversation_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversation_events_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversation_scores: {
        Row: {
          ai_accuracy_score: number | null
          ai_clarity_score: number | null
          ai_confidence_score: number | null
          ai_empathy_score: number | null
          ai_policy_compliance_score: number | null
          ai_resolution_score: number | null
          business_outcome_score: number | null
          channel: string | null
          composite_score: number | null
          conversation_id: string | null
          created_at: string
          customer_id: string | null
          id: string
          language: string | null
          message_id: string | null
          predicted_customer_satisfaction_score: number | null
          score_reasoning_summary: string | null
          scoring_model_version: string | null
        }
        Insert: {
          ai_accuracy_score?: number | null
          ai_clarity_score?: number | null
          ai_confidence_score?: number | null
          ai_empathy_score?: number | null
          ai_policy_compliance_score?: number | null
          ai_resolution_score?: number | null
          business_outcome_score?: number | null
          channel?: string | null
          composite_score?: number | null
          conversation_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          language?: string | null
          message_id?: string | null
          predicted_customer_satisfaction_score?: number | null
          score_reasoning_summary?: string | null
          scoring_model_version?: string | null
        }
        Update: {
          ai_accuracy_score?: number | null
          ai_clarity_score?: number | null
          ai_confidence_score?: number | null
          ai_empathy_score?: number | null
          ai_policy_compliance_score?: number | null
          ai_resolution_score?: number | null
          business_outcome_score?: number | null
          channel?: string | null
          composite_score?: number | null
          conversation_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          language?: string | null
          message_id?: string | null
          predicted_customer_satisfaction_score?: number | null
          score_reasoning_summary?: string | null
          scoring_model_version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversation_scores_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversation_scores_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversation_scores_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_daily_optimization_reports: {
        Row: {
          avg_composite_score: number | null
          avg_customer_rating: number | null
          avg_rating_by_channel: Json | null
          avg_score_by_channel: Json | null
          biggest_score_decline: Json | null
          created_at: string
          executive_summary: string | null
          high_risk_issues: Json | null
          highest_impact_opportunity: Json | null
          id: string
          kb_candidates_generated: number
          low_score_clusters: Json | null
          prompt_candidates_generated: number
          quick_wins: Json | null
          recommended_actions: Json | null
          recommended_kb_improvements: Json | null
          recommended_prompt_experiments: Json | null
          report_date: string
          rollback_events: Json | null
          top_dead_air_patterns: Json | null
          top_failure_patterns: Json | null
          top_missing_knowledge: Json | null
          top_repeated_complaints: Json | null
          top_unresolved_intents: Json | null
          top_weak_prompts: Json | null
          total_conversations_analyzed: number
          total_dead_air_events: number | null
          total_failures: number | null
          winning_experiments: Json | null
        }
        Insert: {
          avg_composite_score?: number | null
          avg_customer_rating?: number | null
          avg_rating_by_channel?: Json | null
          avg_score_by_channel?: Json | null
          biggest_score_decline?: Json | null
          created_at?: string
          executive_summary?: string | null
          high_risk_issues?: Json | null
          highest_impact_opportunity?: Json | null
          id?: string
          kb_candidates_generated?: number
          low_score_clusters?: Json | null
          prompt_candidates_generated?: number
          quick_wins?: Json | null
          recommended_actions?: Json | null
          recommended_kb_improvements?: Json | null
          recommended_prompt_experiments?: Json | null
          report_date: string
          rollback_events?: Json | null
          top_dead_air_patterns?: Json | null
          top_failure_patterns?: Json | null
          top_missing_knowledge?: Json | null
          top_repeated_complaints?: Json | null
          top_unresolved_intents?: Json | null
          top_weak_prompts?: Json | null
          total_conversations_analyzed?: number
          total_dead_air_events?: number | null
          total_failures?: number | null
          winning_experiments?: Json | null
        }
        Update: {
          avg_composite_score?: number | null
          avg_customer_rating?: number | null
          avg_rating_by_channel?: Json | null
          avg_score_by_channel?: Json | null
          biggest_score_decline?: Json | null
          created_at?: string
          executive_summary?: string | null
          high_risk_issues?: Json | null
          highest_impact_opportunity?: Json | null
          id?: string
          kb_candidates_generated?: number
          low_score_clusters?: Json | null
          prompt_candidates_generated?: number
          quick_wins?: Json | null
          recommended_actions?: Json | null
          recommended_kb_improvements?: Json | null
          recommended_prompt_experiments?: Json | null
          report_date?: string
          rollback_events?: Json | null
          top_dead_air_patterns?: Json | null
          top_failure_patterns?: Json | null
          top_missing_knowledge?: Json | null
          top_repeated_complaints?: Json | null
          top_unresolved_intents?: Json | null
          top_weak_prompts?: Json | null
          total_conversations_analyzed?: number
          total_dead_air_events?: number | null
          total_failures?: number | null
          winning_experiments?: Json | null
        }
        Relationships: []
      }
      ai_failure_events: {
        Row: {
          bot_response_excerpt: string | null
          conversation_id: string | null
          created_at: string
          customer_id: string | null
          customer_last_message: string | null
          detected_by: string
          failure_subtype: string | null
          failure_type: Database["public"]["Enums"]["ai_failure_type"]
          id: string
          message_id: string | null
          root_cause_guess: string | null
          severity: Database["public"]["Enums"]["ai_failure_severity"]
          suggested_fix_type: string | null
        }
        Insert: {
          bot_response_excerpt?: string | null
          conversation_id?: string | null
          created_at?: string
          customer_id?: string | null
          customer_last_message?: string | null
          detected_by?: string
          failure_subtype?: string | null
          failure_type: Database["public"]["Enums"]["ai_failure_type"]
          id?: string
          message_id?: string | null
          root_cause_guess?: string | null
          severity?: Database["public"]["Enums"]["ai_failure_severity"]
          suggested_fix_type?: string | null
        }
        Update: {
          bot_response_excerpt?: string | null
          conversation_id?: string | null
          created_at?: string
          customer_id?: string | null
          customer_last_message?: string | null
          detected_by?: string
          failure_subtype?: string | null
          failure_type?: Database["public"]["Enums"]["ai_failure_type"]
          id?: string
          message_id?: string | null
          root_cause_guess?: string | null
          severity?: Database["public"]["Enums"]["ai_failure_severity"]
          suggested_fix_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_failure_events_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_failure_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_failure_events_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_generated_message_batches: {
        Row: {
          approved_template_ids: string[] | null
          campaign_type: string
          channel_type: string
          created_at: string
          created_by: string | null
          customer_context: Json
          customer_profile_id: string | null
          generated_variants: Json
          generation_engine: string | null
          id: string
          intent_type: string
          prompt_version: string | null
          status: string
          tone_type: string
        }
        Insert: {
          approved_template_ids?: string[] | null
          campaign_type: string
          channel_type: string
          created_at?: string
          created_by?: string | null
          customer_context?: Json
          customer_profile_id?: string | null
          generated_variants?: Json
          generation_engine?: string | null
          id?: string
          intent_type: string
          prompt_version?: string | null
          status?: string
          tone_type?: string
        }
        Update: {
          approved_template_ids?: string[] | null
          campaign_type?: string
          channel_type?: string
          created_at?: string
          created_by?: string | null
          customer_context?: Json
          customer_profile_id?: string | null
          generated_variants?: Json
          generation_engine?: string | null
          id?: string
          intent_type?: string
          prompt_version?: string | null
          status?: string
          tone_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generated_message_batches_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_intent_clusters: {
        Row: {
          admin_label: string | null
          admin_notes: string | null
          average_ai_score: number | null
          average_customer_rating: number | null
          channel_distribution: Json | null
          cluster_description: string | null
          cluster_name: string
          common_bad_responses: Json | null
          containment_rate: number | null
          conversation_count: number
          created_at: string
          dead_air_rate: number | null
          human_handoff_rate: number | null
          id: string
          impact_score: number | null
          language: string | null
          language_distribution: Json | null
          recommended_action: string | null
          repeat_contact_rate: number | null
          representative_questions: Json | null
          resolved_without_human_rate: number | null
          root_cause_hypothesis: string | null
          status: string | null
          updated_at: string
          urgency_score: number | null
        }
        Insert: {
          admin_label?: string | null
          admin_notes?: string | null
          average_ai_score?: number | null
          average_customer_rating?: number | null
          channel_distribution?: Json | null
          cluster_description?: string | null
          cluster_name: string
          common_bad_responses?: Json | null
          containment_rate?: number | null
          conversation_count?: number
          created_at?: string
          dead_air_rate?: number | null
          human_handoff_rate?: number | null
          id?: string
          impact_score?: number | null
          language?: string | null
          language_distribution?: Json | null
          recommended_action?: string | null
          repeat_contact_rate?: number | null
          representative_questions?: Json | null
          resolved_without_human_rate?: number | null
          root_cause_hypothesis?: string | null
          status?: string | null
          updated_at?: string
          urgency_score?: number | null
        }
        Update: {
          admin_label?: string | null
          admin_notes?: string | null
          average_ai_score?: number | null
          average_customer_rating?: number | null
          channel_distribution?: Json | null
          cluster_description?: string | null
          cluster_name?: string
          common_bad_responses?: Json | null
          containment_rate?: number | null
          conversation_count?: number
          created_at?: string
          dead_air_rate?: number | null
          human_handoff_rate?: number | null
          id?: string
          impact_score?: number | null
          language?: string | null
          language_distribution?: Json | null
          recommended_action?: string | null
          repeat_contact_rate?: number | null
          representative_questions?: Json | null
          resolved_without_human_rate?: number | null
          root_cause_hypothesis?: string | null
          status?: string | null
          updated_at?: string
          urgency_score?: number | null
        }
        Relationships: []
      }
      ai_score_thresholds: {
        Row: {
          auto_create_failure: boolean
          critical_threshold: number
          dimension: string
          failure_type_override: string | null
          id: string
          updated_at: string
          updated_by: string | null
          warning_threshold: number
        }
        Insert: {
          auto_create_failure?: boolean
          critical_threshold?: number
          dimension: string
          failure_type_override?: string | null
          id?: string
          updated_at?: string
          updated_by?: string | null
          warning_threshold?: number
        }
        Update: {
          auto_create_failure?: boolean
          critical_threshold?: number
          dimension?: string
          failure_type_override?: string | null
          id?: string
          updated_at?: string
          updated_by?: string | null
          warning_threshold?: number
        }
        Relationships: []
      }
      approval_audit_log: {
        Row: {
          action_type: string | null
          approved_at: string | null
          approved_by: string | null
          channel: string | null
          created_at: string
          customer_tier: string | null
          decided_at: string
          decided_by: string | null
          decision: string
          decision_reason: string | null
          domain: string
          execution_status: string | null
          id: string
          input_context: Json | null
          language: string | null
          matched_policy_name: string | null
          policy_id: string | null
          reference_id: string | null
          reference_table: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          risk_level: string | null
        }
        Insert: {
          action_type?: string | null
          approved_at?: string | null
          approved_by?: string | null
          channel?: string | null
          created_at?: string
          customer_tier?: string | null
          decided_at?: string
          decided_by?: string | null
          decision: string
          decision_reason?: string | null
          domain: string
          execution_status?: string | null
          id?: string
          input_context?: Json | null
          language?: string | null
          matched_policy_name?: string | null
          policy_id?: string | null
          reference_id?: string | null
          reference_table?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          risk_level?: string | null
        }
        Update: {
          action_type?: string | null
          approved_at?: string | null
          approved_by?: string | null
          channel?: string | null
          created_at?: string
          customer_tier?: string | null
          decided_at?: string
          decided_by?: string | null
          decision?: string
          decision_reason?: string | null
          domain?: string
          execution_status?: string | null
          id?: string
          input_context?: Json | null
          language?: string | null
          matched_policy_name?: string | null
          policy_id?: string | null
          reference_id?: string | null
          reference_table?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          risk_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_audit_log_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "approval_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_policies: {
        Row: {
          action_type_pattern: string | null
          approval_roles: string[] | null
          auto_test_allowed: boolean | null
          canary_rollout_pct: number | null
          channel_scope: string[] | null
          created_at: string
          created_by: string | null
          customer_tier_scope: string[] | null
          decision: string
          description: string | null
          domain: string
          escalation_timeout_hours: number | null
          id: string
          intent_scope: string[] | null
          is_active: boolean | null
          language_scope: string[] | null
          max_auto_amount: number | null
          policy_name: string
          priority: number | null
          risk_level: string | null
          updated_at: string
        }
        Insert: {
          action_type_pattern?: string | null
          approval_roles?: string[] | null
          auto_test_allowed?: boolean | null
          canary_rollout_pct?: number | null
          channel_scope?: string[] | null
          created_at?: string
          created_by?: string | null
          customer_tier_scope?: string[] | null
          decision?: string
          description?: string | null
          domain: string
          escalation_timeout_hours?: number | null
          id?: string
          intent_scope?: string[] | null
          is_active?: boolean | null
          language_scope?: string[] | null
          max_auto_amount?: number | null
          policy_name: string
          priority?: number | null
          risk_level?: string | null
          updated_at?: string
        }
        Update: {
          action_type_pattern?: string | null
          approval_roles?: string[] | null
          auto_test_allowed?: boolean | null
          canary_rollout_pct?: number | null
          channel_scope?: string[] | null
          created_at?: string
          created_by?: string | null
          customer_tier_scope?: string[] | null
          decision?: string
          description?: string | null
          domain?: string
          escalation_timeout_hours?: number | null
          id?: string
          intent_scope?: string[] | null
          is_active?: boolean | null
          language_scope?: string[] | null
          max_auto_amount?: number | null
          policy_name?: string
          priority?: number | null
          risk_level?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      autonomous_actions_log: {
        Row: {
          action_payload: Json | null
          action_result: Json | null
          action_status: string
          action_summary: string | null
          action_type: string
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          completed_at: string | null
          conversation_id: string | null
          created_at: string
          customer_id: string | null
          error_message: string | null
          id: string
          is_dry_run: boolean
          max_retries: number
          requires_approval: boolean
          retry_count: number
          triggered_by: string
          updated_at: string
        }
        Insert: {
          action_payload?: Json | null
          action_result?: Json | null
          action_status?: string
          action_summary?: string | null
          action_type: string
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          customer_id?: string | null
          error_message?: string | null
          id?: string
          is_dry_run?: boolean
          max_retries?: number
          requires_approval?: boolean
          retry_count?: number
          triggered_by?: string
          updated_at?: string
        }
        Update: {
          action_payload?: Json | null
          action_result?: Json | null
          action_status?: string
          action_summary?: string | null
          action_type?: string
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          customer_id?: string | null
          error_message?: string | null
          id?: string
          is_dry_run?: boolean
          max_retries?: number
          requires_approval?: boolean
          retry_count?: number
          triggered_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "autonomous_actions_log_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autonomous_actions_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_analytics: {
        Row: {
          campaign_id: string
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          page_url: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          page_url?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          page_url?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_analytics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "promo_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_promo_codes: {
        Row: {
          campaign_id: string
          created_at: string | null
          id: string
          promo_code_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          id?: string
          promo_code_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          id?: string
          promo_code_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_promo_codes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "promo_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_promo_codes_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      canned_responses: {
        Row: {
          category: string | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_global: boolean
          shortcut: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_global?: boolean
          shortcut?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_global?: boolean
          shortcut?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      channel_connections: {
        Row: {
          access_token: string | null
          channel_type: string
          connected_at: string | null
          connected_by: string | null
          created_at: string | null
          external_id: string
          id: string
          last_verified_at: string | null
          name: string
          profile_picture_url: string | null
          settings: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          channel_type: string
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string | null
          external_id: string
          id?: string
          last_verified_at?: string | null
          name: string
          profile_picture_url?: string | null
          settings?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          channel_type?: string
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string | null
          external_id?: string
          id?: string
          last_verified_at?: string | null
          name?: string
          profile_picture_url?: string | null
          settings?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_email_verifications: {
        Row: {
          attempts: number
          code_hash: string
          created_at: string
          email: string
          expires_at: string
          id: string
          session_token: string
          verified_at: string | null
        }
        Insert: {
          attempts?: number
          code_hash: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          session_token: string
          verified_at?: string | null
        }
        Update: {
          attempts?: number
          code_hash?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          session_token?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      chatbot_leads: {
        Row: {
          created_at: string
          data_usage: string | null
          destination: string | null
          has_used_esim: string | null
          id: string
          language: string | null
          name: string
          purchase_reason: string | null
          session_token: string | null
          trip_days: number | null
        }
        Insert: {
          created_at?: string
          data_usage?: string | null
          destination?: string | null
          has_used_esim?: string | null
          id?: string
          language?: string | null
          name: string
          purchase_reason?: string | null
          session_token?: string | null
          trip_days?: number | null
        }
        Update: {
          created_at?: string
          data_usage?: string | null
          destination?: string | null
          has_used_esim?: string | null
          id?: string
          language?: string | null
          name?: string
          purchase_reason?: string | null
          session_token?: string | null
          trip_days?: number | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string
          email: string | null
          facebook_display_name: string | null
          facebook_id: string | null
          facebook_picture_url: string | null
          id: string
          instagram_id: string | null
          line_display_name: string | null
          line_id: string | null
          line_picture_url: string | null
          line_user_id: string | null
          metadata: Json | null
          name: string | null
          phone: string | null
          session_token: string | null
          tiktok_id: string | null
          updated_at: string
          user_id: string | null
          whatsapp_phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          facebook_display_name?: string | null
          facebook_id?: string | null
          facebook_picture_url?: string | null
          id?: string
          instagram_id?: string | null
          line_display_name?: string | null
          line_id?: string | null
          line_picture_url?: string | null
          line_user_id?: string | null
          metadata?: Json | null
          name?: string | null
          phone?: string | null
          session_token?: string | null
          tiktok_id?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp_phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          facebook_display_name?: string | null
          facebook_id?: string | null
          facebook_picture_url?: string | null
          id?: string
          instagram_id?: string | null
          line_display_name?: string | null
          line_id?: string | null
          line_picture_url?: string | null
          line_user_id?: string | null
          metadata?: Json | null
          name?: string | null
          phone?: string | null
          session_token?: string | null
          tiktok_id?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp_phone?: string | null
        }
        Relationships: []
      }
      conversation_intent_matches: {
        Row: {
          behavior_compliance: Json | null
          confidence: number | null
          conversation_id: string
          created_at: string | null
          id: string
          improvement_suggestions: string[] | null
          intent_id: string
          matched_keywords: string[] | null
          score_vs_expectation: Json | null
        }
        Insert: {
          behavior_compliance?: Json | null
          confidence?: number | null
          conversation_id: string
          created_at?: string | null
          id?: string
          improvement_suggestions?: string[] | null
          intent_id: string
          matched_keywords?: string[] | null
          score_vs_expectation?: Json | null
        }
        Update: {
          behavior_compliance?: Json | null
          confidence?: number | null
          conversation_id?: string
          created_at?: string | null
          id?: string
          improvement_suggestions?: string[] | null
          intent_id?: string
          matched_keywords?: string[] | null
          score_vs_expectation?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_intent_matches_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_intent_matches_intent_id_fkey"
            columns: ["intent_id"]
            isOneToOne: false
            referencedRelation: "domain_intent_library"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_internal_note: boolean
          metadata: Json | null
          sender_id: string | null
          sender_type: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_internal_note?: boolean
          metadata?: Json | null
          sender_id?: string | null
          sender_type?: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_internal_note?: boolean
          metadata?: Json | null
          sender_id?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_ratings: {
        Row: {
          channel: string | null
          conversation_id: string | null
          created_at: string | null
          feedback_text: string | null
          id: string
          language: string | null
          rating: number
        }
        Insert: {
          channel?: string | null
          conversation_id?: string | null
          created_at?: string | null
          feedback_text?: string | null
          id?: string
          language?: string | null
          rating: number
        }
        Update: {
          channel?: string | null
          conversation_id?: string | null
          created_at?: string | null
          feedback_text?: string | null
          id?: string
          language?: string | null
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "conversation_ratings_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          assigned_to: string | null
          channel: string
          contact_id: string | null
          created_at: string
          first_response_at: string | null
          id: string
          metadata: Json | null
          priority: string
          resolved_at: string | null
          status: string
          subject: string | null
          ticket_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          channel?: string
          contact_id?: string | null
          created_at?: string
          first_response_at?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string | null
          ticket_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          channel?: string
          contact_id?: string | null
          created_at?: string
          first_response_at?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string | null
          ticket_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      country_carriers: {
        Row: {
          carrier_name: string
          country_code: string
          country_name: string
          created_at: string | null
          id: string
          network_type: string
          region_preset: string | null
          source: string | null
          updated_at: string | null
        }
        Insert: {
          carrier_name: string
          country_code: string
          country_name: string
          created_at?: string | null
          id?: string
          network_type: string
          region_preset?: string | null
          source?: string | null
          updated_at?: string | null
        }
        Update: {
          carrier_name?: string
          country_code?: string
          country_name?: string
          created_at?: string | null
          id?: string
          network_type?: string
          region_preset?: string | null
          source?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_channel_identities: {
        Row: {
          channel_display_name: string | null
          channel_type: string
          channel_user_id: string
          created_at: string
          customer_profile_id: string
          id: string
          is_opted_in: boolean
          is_primary: boolean
          is_reachable: boolean
          is_verified: boolean
          last_inbound_at: string | null
          last_outbound_at: string | null
          last_seen_at: string | null
          metadata: Json
          sendability_reason: string | null
          sendability_status: string
          updated_at: string
        }
        Insert: {
          channel_display_name?: string | null
          channel_type: string
          channel_user_id: string
          created_at?: string
          customer_profile_id: string
          id?: string
          is_opted_in?: boolean
          is_primary?: boolean
          is_reachable?: boolean
          is_verified?: boolean
          last_inbound_at?: string | null
          last_outbound_at?: string | null
          last_seen_at?: string | null
          metadata?: Json
          sendability_reason?: string | null
          sendability_status?: string
          updated_at?: string
        }
        Update: {
          channel_display_name?: string | null
          channel_type?: string
          channel_user_id?: string
          created_at?: string
          customer_profile_id?: string
          id?: string
          is_opted_in?: boolean
          is_primary?: boolean
          is_reachable?: boolean
          is_verified?: boolean
          last_inbound_at?: string | null
          last_outbound_at?: string | null
          last_seen_at?: string | null
          metadata?: Json
          sendability_reason?: string | null
          sendability_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_channel_identities_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_journey_templates: {
        Row: {
          action_opportunities: Json
          avg_conversion_rate: number | null
          avg_dead_air_rate: number | null
          avg_resolution_rate: number | null
          avg_satisfaction_score: number | null
          category: string
          created_at: string
          description: string | null
          fallback_rules: Json
          handoff_triggers: Json
          id: string
          ideal_steps: Json
          is_active: boolean
          journey_key: string
          journey_name: string
          optimization_targets: Json
          priority: number
          scoring_criteria: Json
          success_outcomes: Json
          total_conversations: number
          trigger_intents: string[]
          trigger_keywords: string[]
          updated_at: string
        }
        Insert: {
          action_opportunities?: Json
          avg_conversion_rate?: number | null
          avg_dead_air_rate?: number | null
          avg_resolution_rate?: number | null
          avg_satisfaction_score?: number | null
          category?: string
          created_at?: string
          description?: string | null
          fallback_rules?: Json
          handoff_triggers?: Json
          id?: string
          ideal_steps?: Json
          is_active?: boolean
          journey_key: string
          journey_name: string
          optimization_targets?: Json
          priority?: number
          scoring_criteria?: Json
          success_outcomes?: Json
          total_conversations?: number
          trigger_intents?: string[]
          trigger_keywords?: string[]
          updated_at?: string
        }
        Update: {
          action_opportunities?: Json
          avg_conversion_rate?: number | null
          avg_dead_air_rate?: number | null
          avg_resolution_rate?: number | null
          avg_satisfaction_score?: number | null
          category?: string
          created_at?: string
          description?: string | null
          fallback_rules?: Json
          handoff_triggers?: Json
          id?: string
          ideal_steps?: Json
          is_active?: boolean
          journey_key?: string
          journey_name?: string
          optimization_targets?: Json
          priority?: number
          scoring_criteria?: Json
          success_outcomes?: Json
          total_conversations?: number
          trigger_intents?: string[]
          trigger_keywords?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      customer_memory: {
        Row: {
          category: string
          contact_id: string
          fact_key: string
          fact_value: string
          id: string
          source_conversation_id: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          contact_id: string
          fact_key: string
          fact_value: string
          id?: string
          source_conversation_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          contact_id?: string
          fact_key?: string
          fact_value?: string
          id?: string
          source_conversation_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_memory_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_memory_source_conversation_id_fkey"
            columns: ["source_conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_preferences: {
        Row: {
          customer_profile_id: string
          manual_suppressed_until: string | null
          manual_suppression_reason: string | null
          max_sends_30d: number
          max_sends_7d: number
          opt_out_all: boolean
          opt_out_email: boolean
          opt_out_facebook: boolean
          opt_out_line: boolean
          opt_out_whatsapp: boolean
          prefers_news_and_promotions: boolean
          prefers_sales_followup: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          updated_at: string
        }
        Insert: {
          customer_profile_id: string
          manual_suppressed_until?: string | null
          manual_suppression_reason?: string | null
          max_sends_30d?: number
          max_sends_7d?: number
          opt_out_all?: boolean
          opt_out_email?: boolean
          opt_out_facebook?: boolean
          opt_out_line?: boolean
          opt_out_whatsapp?: boolean
          prefers_news_and_promotions?: boolean
          prefers_sales_followup?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
        }
        Update: {
          customer_profile_id?: string
          manual_suppressed_until?: string | null
          manual_suppression_reason?: string | null
          max_sends_30d?: number
          max_sends_7d?: number
          opt_out_all?: boolean
          opt_out_email?: boolean
          opt_out_facebook?: boolean
          opt_out_line?: boolean
          opt_out_whatsapp?: boolean
          prefers_news_and_promotions?: boolean
          prefers_sales_followup?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_preferences_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: true
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_profile_contacts: {
        Row: {
          contact_id: string
          created_at: string
          customer_profile_id: string
          id: string
          is_primary: boolean
          relationship_type: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          customer_profile_id: string
          id?: string
          is_primary?: boolean
          relationship_type?: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          customer_profile_id?: string
          id?: string
          is_primary?: boolean
          relationship_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_profile_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_profile_contacts_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_profiles: {
        Row: {
          country: string | null
          created_at: string
          full_name: string | null
          id: string
          identity_resolution_confidence: number
          identity_status: string
          last_inbound_at: string | null
          last_outbound_at: string | null
          latest_lead_source: string | null
          metadata: Json
          original_lead_source: string | null
          preferred_language: string | null
          primary_email: string | null
          primary_phone: string | null
          timezone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          identity_resolution_confidence?: number
          identity_status?: string
          last_inbound_at?: string | null
          last_outbound_at?: string | null
          latest_lead_source?: string | null
          metadata?: Json
          original_lead_source?: string | null
          preferred_language?: string | null
          primary_email?: string | null
          primary_phone?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          identity_resolution_confidence?: number
          identity_status?: string
          last_inbound_at?: string | null
          last_outbound_at?: string | null
          latest_lead_source?: string | null
          metadata?: Json
          original_lead_source?: string | null
          preferred_language?: string | null
          primary_email?: string | null
          primary_phone?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      customer_stage_history: {
        Row: {
          classification_version: string | null
          confidence: number | null
          created_at: string
          customer_profile_id: string
          id: string
          metadata: Json
          new_stage: string
          old_stage: string | null
          reason: string | null
          source_event_id: string | null
          source_event_type: string | null
          source_type: string
          source_user_id: string | null
          stage_dimension: string
        }
        Insert: {
          classification_version?: string | null
          confidence?: number | null
          created_at?: string
          customer_profile_id: string
          id?: string
          metadata?: Json
          new_stage: string
          old_stage?: string | null
          reason?: string | null
          source_event_id?: string | null
          source_event_type?: string | null
          source_type: string
          source_user_id?: string | null
          stage_dimension: string
        }
        Update: {
          classification_version?: string | null
          confidence?: number | null
          created_at?: string
          customer_profile_id?: string
          id?: string
          metadata?: Json
          new_stage?: string
          old_stage?: string | null
          reason?: string | null
          source_event_id?: string | null
          source_event_type?: string | null
          source_type?: string
          source_user_id?: string | null
          stage_dimension?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_stage_history_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_stage_state: {
        Row: {
          capability_confidence: number
          capability_source_type: string
          capability_stage: string | null
          capability_updated_at: string
          classification_version: string
          created_at: string
          customer_profile_id: string
          experience_confidence: number
          experience_source_type: string
          experience_stage: string | null
          experience_updated_at: string
          funnel_confidence: number
          funnel_source_type: string
          funnel_stage: string
          funnel_updated_at: string
          last_updated_reason: string | null
          last_updated_source_type: string
          last_updated_user_id: string | null
          updated_at: string
        }
        Insert: {
          capability_confidence?: number
          capability_source_type?: string
          capability_stage?: string | null
          capability_updated_at?: string
          classification_version?: string
          created_at?: string
          customer_profile_id: string
          experience_confidence?: number
          experience_source_type?: string
          experience_stage?: string | null
          experience_updated_at?: string
          funnel_confidence?: number
          funnel_source_type?: string
          funnel_stage?: string
          funnel_updated_at?: string
          last_updated_reason?: string | null
          last_updated_source_type?: string
          last_updated_user_id?: string | null
          updated_at?: string
        }
        Update: {
          capability_confidence?: number
          capability_source_type?: string
          capability_stage?: string | null
          capability_updated_at?: string
          classification_version?: string
          created_at?: string
          customer_profile_id?: string
          experience_confidence?: number
          experience_source_type?: string
          experience_stage?: string | null
          experience_updated_at?: string
          funnel_confidence?: number
          funnel_source_type?: string
          funnel_stage?: string
          funnel_updated_at?: string
          last_updated_reason?: string | null
          last_updated_source_type?: string
          last_updated_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_stage_state_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: true
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dead_air_events: {
        Row: {
          bot_message_content: string
          bot_message_id: string | null
          channel: string | null
          conversation_id: string
          created_at: string | null
          customer_returned: boolean | null
          id: string
          silence_duration_seconds: number
        }
        Insert: {
          bot_message_content: string
          bot_message_id?: string | null
          channel?: string | null
          conversation_id: string
          created_at?: string | null
          customer_returned?: boolean | null
          id?: string
          silence_duration_seconds: number
        }
        Update: {
          bot_message_content?: string
          bot_message_id?: string | null
          channel?: string | null
          conversation_id?: string
          created_at?: string | null
          customer_returned?: boolean | null
          id?: string
          silence_duration_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "dead_air_events_bot_message_id_fkey"
            columns: ["bot_message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dead_air_events_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      destination_ab_assignments: {
        Row: {
          assigned_at: string | null
          id: string
          session_id: string | null
          test_id: string
          user_id: string | null
          variant_id: string
        }
        Insert: {
          assigned_at?: string | null
          id?: string
          session_id?: string | null
          test_id: string
          user_id?: string | null
          variant_id: string
        }
        Update: {
          assigned_at?: string | null
          id?: string
          session_id?: string | null
          test_id?: string
          user_id?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "destination_ab_assignments_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "destination_ab_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "destination_ab_assignments_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "destination_ab_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      destination_ab_tests: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: string
          traffic_allocation: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string
          traffic_allocation?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string
          traffic_allocation?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      destination_ab_variants: {
        Row: {
          config: Json
          created_at: string | null
          description: string | null
          id: string
          is_control: boolean | null
          name: string
          test_id: string
          traffic_weight: number
        }
        Insert: {
          config: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_control?: boolean | null
          name: string
          test_id: string
          traffic_weight?: number
        }
        Update: {
          config?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_control?: boolean | null
          name?: string
          test_id?: string
          traffic_weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "destination_ab_variants_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "destination_ab_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      destination_analytics: {
        Row: {
          clicked_at: string
          destination: string
          destination_type: string
          id: string
          session_id: string | null
          test_id: string | null
          user_country: string
          user_id: string | null
          user_language: string
          variant_id: string | null
        }
        Insert: {
          clicked_at?: string
          destination: string
          destination_type: string
          id?: string
          session_id?: string | null
          test_id?: string | null
          user_country: string
          user_id?: string | null
          user_language: string
          variant_id?: string | null
        }
        Update: {
          clicked_at?: string
          destination?: string
          destination_type?: string
          id?: string
          session_id?: string | null
          test_id?: string | null
          user_country?: string
          user_id?: string | null
          user_language?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "destination_analytics_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "destination_ab_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "destination_analytics_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "destination_ab_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      destination_conversions: {
        Row: {
          analytics_id: string | null
          clicked_at: string
          conversion_value: number | null
          converted_at: string | null
          created_at: string | null
          destination: string
          id: string
          order_id: string | null
          package_id: string | null
          session_id: string | null
          test_id: string | null
          user_id: string | null
          variant_id: string | null
        }
        Insert: {
          analytics_id?: string | null
          clicked_at: string
          conversion_value?: number | null
          converted_at?: string | null
          created_at?: string | null
          destination: string
          id?: string
          order_id?: string | null
          package_id?: string | null
          session_id?: string | null
          test_id?: string | null
          user_id?: string | null
          variant_id?: string | null
        }
        Update: {
          analytics_id?: string | null
          clicked_at?: string
          conversion_value?: number | null
          converted_at?: string | null
          created_at?: string | null
          destination?: string
          id?: string
          order_id?: string | null
          package_id?: string | null
          session_id?: string | null
          test_id?: string | null
          user_id?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "destination_conversions_analytics_id_fkey"
            columns: ["analytics_id"]
            isOneToOne: false
            referencedRelation: "destination_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "destination_conversions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "destination_conversions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "esim_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "destination_conversions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "esim_packages_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "destination_conversions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "destination_ab_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "destination_conversions_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "destination_ab_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_intent_library: {
        Row: {
          avg_rating: number | null
          avg_score: number | null
          category: string
          containment_rate: number | null
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          ideal_actions: Json
          ideal_behavior: Json
          intent_key: string
          is_active: boolean | null
          matching_keywords: string[]
          matching_patterns: string[] | null
          related_action_types: string[] | null
          related_cluster_names: string[] | null
          related_kb_categories: string[] | null
          resolution_criteria: Json
          score_expectations: Json
          target_channels: string[] | null
          total_conversations: number | null
          typical_failures: Json
          updated_at: string | null
        }
        Insert: {
          avg_rating?: number | null
          avg_score?: number | null
          category?: string
          containment_rate?: number | null
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          ideal_actions?: Json
          ideal_behavior?: Json
          intent_key: string
          is_active?: boolean | null
          matching_keywords?: string[]
          matching_patterns?: string[] | null
          related_action_types?: string[] | null
          related_cluster_names?: string[] | null
          related_kb_categories?: string[] | null
          resolution_criteria?: Json
          score_expectations?: Json
          target_channels?: string[] | null
          total_conversations?: number | null
          typical_failures?: Json
          updated_at?: string | null
        }
        Update: {
          avg_rating?: number | null
          avg_score?: number | null
          category?: string
          containment_rate?: number | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          ideal_actions?: Json
          ideal_behavior?: Json
          intent_key?: string
          is_active?: boolean | null
          matching_keywords?: string[]
          matching_patterns?: string[] | null
          related_action_types?: string[] | null
          related_cluster_names?: string[] | null
          related_kb_categories?: string[] | null
          resolution_criteria?: Json
          score_expectations?: Json
          target_channels?: string[] | null
          total_conversations?: number | null
          typical_failures?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      email_whitelist: {
        Row: {
          added_by: string | null
          created_at: string | null
          email: string
          id: string
          reason: string | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string | null
          email: string
          id?: string
          reason?: string | null
        }
        Update: {
          added_by?: string | null
          created_at?: string | null
          email?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      esim_packages: {
        Row: {
          access_type: string | null
          activation_note: string | null
          apn: string | null
          availability: string | null
          carrier: string | null
          category: string | null
          complaint_count: number | null
          cost_price: number | null
          cost_price_per_gb: number | null
          country_code: string
          country_name: string
          created_at: string
          currency: string
          daily_data_reset: boolean | null
          daily_reset_amount: string | null
          data_amount: string
          description: string | null
          featured_order: number | null
          hot_spot: boolean | null
          id: string
          included_countries: Json | null
          initialize_policy: string | null
          is_active: boolean
          is_cancelable: boolean | null
          is_featured: boolean | null
          is_local_sim: boolean | null
          is_popular: boolean | null
          kyc: boolean | null
          markup_fixed: number | null
          markup_percentage: number | null
          min_sell_price: number | null
          name: string
          network_type: string | null
          normal_price: number | null
          package_id: string
          package_type: string | null
          pre_installation: boolean | null
          price: number
          provider_id: string | null
          provider_metadata: Json | null
          provider_package_type: string | null
          purchase_count: number | null
          qos_speed: string | null
          quality_score: number | null
          service_type: string | null
          short_name: string | null
          sim_type: string | null
          speed_after_limit: string | null
          success_rate: number | null
          support_data: boolean | null
          support_sms: boolean | null
          support_voice: boolean | null
          supports_extension: boolean | null
          top_up: boolean | null
          total_orders: number | null
          updated_at: string
          validity_days: number
          validity_period: string | null
        }
        Insert: {
          access_type?: string | null
          activation_note?: string | null
          apn?: string | null
          availability?: string | null
          carrier?: string | null
          category?: string | null
          complaint_count?: number | null
          cost_price?: number | null
          cost_price_per_gb?: number | null
          country_code: string
          country_name: string
          created_at?: string
          currency?: string
          daily_data_reset?: boolean | null
          daily_reset_amount?: string | null
          data_amount: string
          description?: string | null
          featured_order?: number | null
          hot_spot?: boolean | null
          id?: string
          included_countries?: Json | null
          initialize_policy?: string | null
          is_active?: boolean
          is_cancelable?: boolean | null
          is_featured?: boolean | null
          is_local_sim?: boolean | null
          is_popular?: boolean | null
          kyc?: boolean | null
          markup_fixed?: number | null
          markup_percentage?: number | null
          min_sell_price?: number | null
          name: string
          network_type?: string | null
          normal_price?: number | null
          package_id: string
          package_type?: string | null
          pre_installation?: boolean | null
          price: number
          provider_id?: string | null
          provider_metadata?: Json | null
          provider_package_type?: string | null
          purchase_count?: number | null
          qos_speed?: string | null
          quality_score?: number | null
          service_type?: string | null
          short_name?: string | null
          sim_type?: string | null
          speed_after_limit?: string | null
          success_rate?: number | null
          support_data?: boolean | null
          support_sms?: boolean | null
          support_voice?: boolean | null
          supports_extension?: boolean | null
          top_up?: boolean | null
          total_orders?: number | null
          updated_at?: string
          validity_days: number
          validity_period?: string | null
        }
        Update: {
          access_type?: string | null
          activation_note?: string | null
          apn?: string | null
          availability?: string | null
          carrier?: string | null
          category?: string | null
          complaint_count?: number | null
          cost_price?: number | null
          cost_price_per_gb?: number | null
          country_code?: string
          country_name?: string
          created_at?: string
          currency?: string
          daily_data_reset?: boolean | null
          daily_reset_amount?: string | null
          data_amount?: string
          description?: string | null
          featured_order?: number | null
          hot_spot?: boolean | null
          id?: string
          included_countries?: Json | null
          initialize_policy?: string | null
          is_active?: boolean
          is_cancelable?: boolean | null
          is_featured?: boolean | null
          is_local_sim?: boolean | null
          is_popular?: boolean | null
          kyc?: boolean | null
          markup_fixed?: number | null
          markup_percentage?: number | null
          min_sell_price?: number | null
          name?: string
          network_type?: string | null
          normal_price?: number | null
          package_id?: string
          package_type?: string | null
          pre_installation?: boolean | null
          price?: number
          provider_id?: string | null
          provider_metadata?: Json | null
          provider_package_type?: string | null
          purchase_count?: number | null
          qos_speed?: string | null
          quality_score?: number | null
          service_type?: string | null
          short_name?: string | null
          sim_type?: string | null
          speed_after_limit?: string | null
          success_rate?: number | null
          support_data?: boolean | null
          support_sms?: boolean | null
          support_voice?: boolean | null
          supports_extension?: boolean | null
          top_up?: boolean | null
          total_orders?: number | null
          updated_at?: string
          validity_days?: number
          validity_period?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "esim_packages_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "esim_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      esim_providers: {
        Row: {
          api_base_url: string | null
          api_base_url_sandbox: string | null
          auth_config: Json | null
          auth_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          priority: number | null
          provider_code: string
          provider_name: string
          updated_at: string | null
          webhook_secret: string | null
          webhook_url: string | null
        }
        Insert: {
          api_base_url?: string | null
          api_base_url_sandbox?: string | null
          auth_config?: Json | null
          auth_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          priority?: number | null
          provider_code: string
          provider_name: string
          updated_at?: string | null
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Update: {
          api_base_url?: string | null
          api_base_url_sandbox?: string | null
          auth_config?: Json | null
          auth_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          priority?: number | null
          provider_code?: string
          provider_name?: string
          updated_at?: string | null
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      fallback_rules: {
        Row: {
          cooldown_minutes: number
          created_at: string
          fallback_provider_id: string | null
          id: string
          is_enabled: boolean
          last_triggered_at: string | null
          notes: string | null
          primary_provider_id: string | null
          priority: number
          recovery_success_count: number
          rule_name: string
          scope: string
          trigger_condition: string
          trigger_count: number
          trigger_threshold: number
          updated_at: string
        }
        Insert: {
          cooldown_minutes?: number
          created_at?: string
          fallback_provider_id?: string | null
          id?: string
          is_enabled?: boolean
          last_triggered_at?: string | null
          notes?: string | null
          primary_provider_id?: string | null
          priority?: number
          recovery_success_count?: number
          rule_name: string
          scope?: string
          trigger_condition?: string
          trigger_count?: number
          trigger_threshold?: number
          updated_at?: string
        }
        Update: {
          cooldown_minutes?: number
          created_at?: string
          fallback_provider_id?: string | null
          id?: string
          is_enabled?: boolean
          last_triggered_at?: string | null
          notes?: string | null
          primary_provider_id?: string | null
          priority?: number
          recovery_success_count?: number
          rule_name?: string
          scope?: string
          trigger_condition?: string
          trigger_count?: number
          trigger_threshold?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fallback_rules_fallback_provider_id_fkey"
            columns: ["fallback_provider_id"]
            isOneToOne: false
            referencedRelation: "esim_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fallback_rules_primary_provider_id_fkey"
            columns: ["primary_provider_id"]
            isOneToOne: false
            referencedRelation: "esim_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_analytics: {
        Row: {
          auto_suggested: boolean | null
          avg_rating: number | null
          channels: Json | null
          created_at: string | null
          id: string
          last_seen_at: string | null
          question_cluster: string
          question_count: number | null
          sample_questions: Json | null
        }
        Insert: {
          auto_suggested?: boolean | null
          avg_rating?: number | null
          channels?: Json | null
          created_at?: string | null
          id?: string
          last_seen_at?: string | null
          question_cluster: string
          question_count?: number | null
          sample_questions?: Json | null
        }
        Update: {
          auto_suggested?: boolean | null
          avg_rating?: number | null
          channels?: Json | null
          created_at?: string | null
          id?: string
          last_seen_at?: string | null
          question_cluster?: string
          question_count?: number | null
          sample_questions?: Json | null
        }
        Relationships: []
      }
      faq_candidates: {
        Row: {
          analytics_measured_at: string | null
          approved_by: string | null
          canonical_question: string
          category: string | null
          confidence: number | null
          confusion_score: number | null
          conversation_count: number | null
          created_at: string | null
          customer_phrasings: Json | null
          expected_support_reduction: number | null
          faq_title: string | null
          frequency_score: number | null
          generated_by: string | null
          id: string
          intent_tag: string | null
          language: string | null
          long_answer: string | null
          post_publish_dead_air_rate: number | null
          post_publish_low_rating_rate: number | null
          pre_publish_dead_air_rate: number | null
          pre_publish_low_rating_rate: number | null
          priority: number | null
          publish_target: string | null
          published_article_id: string | null
          published_at: string | null
          rejected_reason: string | null
          sample_conversation_ids: Json | null
          short_answer: string | null
          source_cluster_id: string | null
          source_failure_types: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          analytics_measured_at?: string | null
          approved_by?: string | null
          canonical_question: string
          category?: string | null
          confidence?: number | null
          confusion_score?: number | null
          conversation_count?: number | null
          created_at?: string | null
          customer_phrasings?: Json | null
          expected_support_reduction?: number | null
          faq_title?: string | null
          frequency_score?: number | null
          generated_by?: string | null
          id?: string
          intent_tag?: string | null
          language?: string | null
          long_answer?: string | null
          post_publish_dead_air_rate?: number | null
          post_publish_low_rating_rate?: number | null
          pre_publish_dead_air_rate?: number | null
          pre_publish_low_rating_rate?: number | null
          priority?: number | null
          publish_target?: string | null
          published_article_id?: string | null
          published_at?: string | null
          rejected_reason?: string | null
          sample_conversation_ids?: Json | null
          short_answer?: string | null
          source_cluster_id?: string | null
          source_failure_types?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          analytics_measured_at?: string | null
          approved_by?: string | null
          canonical_question?: string
          category?: string | null
          confidence?: number | null
          confusion_score?: number | null
          conversation_count?: number | null
          created_at?: string | null
          customer_phrasings?: Json | null
          expected_support_reduction?: number | null
          faq_title?: string | null
          frequency_score?: number | null
          generated_by?: string | null
          id?: string
          intent_tag?: string | null
          language?: string | null
          long_answer?: string | null
          post_publish_dead_air_rate?: number | null
          post_publish_low_rating_rate?: number | null
          pre_publish_dead_air_rate?: number | null
          pre_publish_low_rating_rate?: number | null
          priority?: number | null
          publish_target?: string | null
          published_article_id?: string | null
          published_at?: string | null
          rejected_reason?: string | null
          sample_conversation_ids?: Json | null
          short_answer?: string | null
          source_cluster_id?: string | null
          source_failure_types?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faq_candidates_published_article_id_fkey"
            columns: ["published_article_id"]
            isOneToOne: false
            referencedRelation: "kb_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faq_candidates_source_cluster_id_fkey"
            columns: ["source_cluster_id"]
            isOneToOne: false
            referencedRelation: "ai_intent_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      guardrail_change_requests: {
        Row: {
          approval_required: boolean | null
          approved_at: string | null
          approved_by: string | null
          canary_result: Json | null
          canary_started_at: string | null
          change_description: string | null
          change_payload: Json | null
          change_title: string
          change_type: string
          created_at: string
          created_by: string | null
          domain: Database["public"]["Enums"]["guardrail_change_domain"]
          id: string
          previous_version_id: string | null
          promoted_at: string | null
          promoted_by: string | null
          reference_id: string | null
          reference_table: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          revert_reason: string | null
          reverted_at: string | null
          reverted_by: string | null
          risk_level: Database["public"]["Enums"]["guardrail_risk_level"]
          rollout_mode: string | null
          rollout_pct: number | null
          shadow_result: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          approval_required?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          canary_result?: Json | null
          canary_started_at?: string | null
          change_description?: string | null
          change_payload?: Json | null
          change_title: string
          change_type: string
          created_at?: string
          created_by?: string | null
          domain: Database["public"]["Enums"]["guardrail_change_domain"]
          id?: string
          previous_version_id?: string | null
          promoted_at?: string | null
          promoted_by?: string | null
          reference_id?: string | null
          reference_table?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          revert_reason?: string | null
          reverted_at?: string | null
          reverted_by?: string | null
          risk_level: Database["public"]["Enums"]["guardrail_risk_level"]
          rollout_mode?: string | null
          rollout_pct?: number | null
          shadow_result?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          approval_required?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          canary_result?: Json | null
          canary_started_at?: string | null
          change_description?: string | null
          change_payload?: Json | null
          change_title?: string
          change_type?: string
          created_at?: string
          created_by?: string | null
          domain?: Database["public"]["Enums"]["guardrail_change_domain"]
          id?: string
          previous_version_id?: string | null
          promoted_at?: string | null
          promoted_by?: string | null
          reference_id?: string | null
          reference_table?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          revert_reason?: string | null
          reverted_at?: string | null
          reverted_by?: string | null
          risk_level?: Database["public"]["Enums"]["guardrail_risk_level"]
          rollout_mode?: string | null
          rollout_pct?: number | null
          shadow_result?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      guardrail_rollback_events: {
        Row: {
          change_request_id: string | null
          created_at: string
          id: string
          reason: string | null
          rolled_back_by: string | null
          rolled_back_to: string | null
          threshold_value: number | null
          trigger_metric: string | null
          trigger_type: string
          trigger_value: number | null
        }
        Insert: {
          change_request_id?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          rolled_back_by?: string | null
          rolled_back_to?: string | null
          threshold_value?: number | null
          trigger_metric?: string | null
          trigger_type: string
          trigger_value?: number | null
        }
        Update: {
          change_request_id?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          rolled_back_by?: string | null
          rolled_back_to?: string | null
          threshold_value?: number | null
          trigger_metric?: string | null
          trigger_type?: string
          trigger_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "guardrail_rollback_events_change_request_id_fkey"
            columns: ["change_request_id"]
            isOneToOne: false
            referencedRelation: "guardrail_change_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      guardrail_rules: {
        Row: {
          auto_rollback_enabled: boolean | null
          canary_enabled: boolean | null
          cooldown_hours: number | null
          created_at: string
          description: string | null
          domain: Database["public"]["Enums"]["guardrail_change_domain"]
          id: string
          is_active: boolean | null
          max_rollout_pct: number | null
          min_canary_conversations: number | null
          requires_approval: boolean
          risk_level: Database["public"]["Enums"]["guardrail_risk_level"]
          rollback_dead_air_rise_threshold: number | null
          rollback_low_rating_threshold: number | null
          rollback_score_drop_threshold: number | null
          rule_name: string
          shadow_test_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          auto_rollback_enabled?: boolean | null
          canary_enabled?: boolean | null
          cooldown_hours?: number | null
          created_at?: string
          description?: string | null
          domain: Database["public"]["Enums"]["guardrail_change_domain"]
          id?: string
          is_active?: boolean | null
          max_rollout_pct?: number | null
          min_canary_conversations?: number | null
          requires_approval?: boolean
          risk_level?: Database["public"]["Enums"]["guardrail_risk_level"]
          rollback_dead_air_rise_threshold?: number | null
          rollback_low_rating_threshold?: number | null
          rollback_score_drop_threshold?: number | null
          rule_name: string
          shadow_test_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          auto_rollback_enabled?: boolean | null
          canary_enabled?: boolean | null
          cooldown_hours?: number | null
          created_at?: string
          description?: string | null
          domain?: Database["public"]["Enums"]["guardrail_change_domain"]
          id?: string
          is_active?: boolean | null
          max_rollout_pct?: number | null
          min_canary_conversations?: number | null
          requires_approval?: boolean
          risk_level?: Database["public"]["Enums"]["guardrail_risk_level"]
          rollback_dead_air_rise_threshold?: number | null
          rollback_low_rating_threshold?: number | null
          rollback_score_drop_threshold?: number | null
          rule_name?: string
          shadow_test_enabled?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      journey_enrollments: {
        Row: {
          completed_at: string | null
          current_step_order: number
          customer_profile_id: string
          enrolled_at: string
          enrollment_reason: string | null
          enrollment_source: string
          enrollment_trigger_key: string
          id: string
          journey_id: string
          last_step_executed_at: string | null
          metadata: Json
          status: string
          stopped_reason: string | null
        }
        Insert: {
          completed_at?: string | null
          current_step_order?: number
          customer_profile_id: string
          enrolled_at?: string
          enrollment_reason?: string | null
          enrollment_source: string
          enrollment_trigger_key: string
          id?: string
          journey_id: string
          last_step_executed_at?: string | null
          metadata?: Json
          status?: string
          stopped_reason?: string | null
        }
        Update: {
          completed_at?: string | null
          current_step_order?: number
          customer_profile_id?: string
          enrolled_at?: string
          enrollment_reason?: string | null
          enrollment_source?: string
          enrollment_trigger_key?: string
          id?: string
          journey_id?: string
          last_step_executed_at?: string | null
          metadata?: Json
          status?: string
          stopped_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journey_enrollments_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_enrollments_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "outbound_journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_executions: {
        Row: {
          actions_triggered: Json
          completed_at: string | null
          conversation_id: string | null
          created_at: string
          current_step: string | null
          customer_id: string | null
          id: string
          journey_id: string | null
          journey_score: number | null
          matched_success_criteria: boolean | null
          outcome: string | null
          outcome_details: Json | null
          started_at: string
          steps_completed: Json
        }
        Insert: {
          actions_triggered?: Json
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          current_step?: string | null
          customer_id?: string | null
          id?: string
          journey_id?: string | null
          journey_score?: number | null
          matched_success_criteria?: boolean | null
          outcome?: string | null
          outcome_details?: Json | null
          started_at?: string
          steps_completed?: Json
        }
        Update: {
          actions_triggered?: Json
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          current_step?: string | null
          customer_id?: string | null
          id?: string
          journey_id?: string | null
          journey_score?: number | null
          matched_success_criteria?: boolean | null
          outcome?: string | null
          outcome_details?: Json | null
          started_at?: string
          steps_completed?: Json
        }
        Relationships: [
          {
            foreignKeyName: "journey_executions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_executions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_executions_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "customer_journey_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_articles: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number | null
          id: string
          is_internal: boolean
          is_published: boolean
          language: string
          slug: string | null
          source: string | null
          table_of_contents: Json | null
          tags: string[] | null
          title: string
          updated_at: string
          updated_by: string | null
          view_count: number
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_internal?: boolean
          is_published?: boolean
          language?: string
          slug?: string | null
          source?: string | null
          table_of_contents?: Json | null
          tags?: string[] | null
          title: string
          updated_at?: string
          updated_by?: string | null
          view_count?: number
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_internal?: boolean
          is_published?: boolean
          language?: string
          slug?: string | null
          source?: string | null
          table_of_contents?: Json | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          view_count?: number
        }
        Relationships: []
      }
      kb_improvement_candidates: {
        Row: {
          approved_by: string | null
          confidence_level: number | null
          conversation_examples: Json | null
          created_at: string
          current_kb_excerpt: string | null
          expected_impact: string | null
          generated_by: string
          id: string
          impact_score: number | null
          issue_summary: string
          issue_type: Database["public"]["Enums"]["kb_issue_type"]
          missing_facts: Json | null
          priority: number | null
          proposed_kb_draft: string | null
          published_article_id: string | null
          rejected_reason: string | null
          related_article_id: string | null
          related_cluster_id: string | null
          related_failure_types: Json | null
          status: string
          suggested_category: string | null
          suggested_language: string | null
          suggested_title: string | null
          updated_at: string
          weakness_analysis: string | null
        }
        Insert: {
          approved_by?: string | null
          confidence_level?: number | null
          conversation_examples?: Json | null
          created_at?: string
          current_kb_excerpt?: string | null
          expected_impact?: string | null
          generated_by?: string
          id?: string
          impact_score?: number | null
          issue_summary: string
          issue_type: Database["public"]["Enums"]["kb_issue_type"]
          missing_facts?: Json | null
          priority?: number | null
          proposed_kb_draft?: string | null
          published_article_id?: string | null
          rejected_reason?: string | null
          related_article_id?: string | null
          related_cluster_id?: string | null
          related_failure_types?: Json | null
          status?: string
          suggested_category?: string | null
          suggested_language?: string | null
          suggested_title?: string | null
          updated_at?: string
          weakness_analysis?: string | null
        }
        Update: {
          approved_by?: string | null
          confidence_level?: number | null
          conversation_examples?: Json | null
          created_at?: string
          current_kb_excerpt?: string | null
          expected_impact?: string | null
          generated_by?: string
          id?: string
          impact_score?: number | null
          issue_summary?: string
          issue_type?: Database["public"]["Enums"]["kb_issue_type"]
          missing_facts?: Json | null
          priority?: number | null
          proposed_kb_draft?: string | null
          published_article_id?: string | null
          rejected_reason?: string | null
          related_article_id?: string | null
          related_cluster_id?: string | null
          related_failure_types?: Json | null
          status?: string
          suggested_category?: string | null
          suggested_language?: string | null
          suggested_title?: string | null
          updated_at?: string
          weakness_analysis?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kb_improvement_candidates_published_article_id_fkey"
            columns: ["published_article_id"]
            isOneToOne: false
            referencedRelation: "kb_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kb_improvement_candidates_related_article_id_fkey"
            columns: ["related_article_id"]
            isOneToOne: false
            referencedRelation: "kb_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kb_improvement_candidates_related_cluster_id_fkey"
            columns: ["related_cluster_id"]
            isOneToOne: false
            referencedRelation: "ai_intent_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_tier_config: {
        Row: {
          badge_color: string | null
          cashback_rate: number
          created_at: string | null
          icon_name: string | null
          id: string
          min_spent: number
          tier_display_name: string
          tier_name: string
          tier_order: number
        }
        Insert: {
          badge_color?: string | null
          cashback_rate: number
          created_at?: string | null
          icon_name?: string | null
          id?: string
          min_spent?: number
          tier_display_name: string
          tier_name: string
          tier_order: number
        }
        Update: {
          badge_color?: string | null
          cashback_rate?: number
          created_at?: string | null
          icon_name?: string | null
          id?: string
          min_spent?: number
          tier_display_name?: string
          tier_name?: string
          tier_order?: number
        }
        Relationships: []
      }
      missing_action_candidates: {
        Row: {
          action_description: string | null
          action_name: string
          admin_notes: string | null
          channel: string | null
          cluster_id: string | null
          created_at: string
          detected_intent: string
          estimated_containment_lift: number | null
          estimated_csat_lift: number | null
          estimated_monthly_volume: number | null
          example_conversation_ids: string[] | null
          example_customer_messages: Json | null
          id: string
          impact_score: number | null
          language: string | null
          occurrence_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          suggested_approval_required: boolean | null
          suggested_input_schema: Json | null
          updated_at: string
        }
        Insert: {
          action_description?: string | null
          action_name: string
          admin_notes?: string | null
          channel?: string | null
          cluster_id?: string | null
          created_at?: string
          detected_intent: string
          estimated_containment_lift?: number | null
          estimated_csat_lift?: number | null
          estimated_monthly_volume?: number | null
          example_conversation_ids?: string[] | null
          example_customer_messages?: Json | null
          id?: string
          impact_score?: number | null
          language?: string | null
          occurrence_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggested_approval_required?: boolean | null
          suggested_input_schema?: Json | null
          updated_at?: string
        }
        Update: {
          action_description?: string | null
          action_name?: string
          admin_notes?: string | null
          channel?: string | null
          cluster_id?: string | null
          created_at?: string
          detected_intent?: string
          estimated_containment_lift?: number | null
          estimated_csat_lift?: number | null
          estimated_monthly_volume?: number | null
          example_conversation_ids?: string[] | null
          example_customer_messages?: Json | null
          id?: string
          impact_score?: number | null
          language?: string | null
          occurrence_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggested_approval_required?: boolean | null
          suggested_input_schema?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "missing_action_candidates_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "ai_intent_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      mobile11_money_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          order_id: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mobile11_money_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          activation_code: string | null
          affiliate_id: string | null
          affiliate_session_id: string | null
          auto_renewal_enabled: boolean | null
          cached_installation: Json | null
          cached_usage: Json | null
          carrier_used: string | null
          connection_quality_rating: number | null
          created_at: string
          currency: string
          discount_amount: number | null
          download_link: string | null
          email_verified: boolean
          environment: string
          expiry_date: string | null
          expiry_warning_sent_at: string | null
          guest_email: string | null
          guest_token: string | null
          hidden_by_user: boolean | null
          iccid: string | null
          id: string
          installation_cached_at: string | null
          item_index: number | null
          language: string | null
          last_renewal_attempt_at: string | null
          loyalty_processed: boolean | null
          mobile11_money_applied: number | null
          msisdn: string | null
          notification_email: string | null
          order_id: string
          organization_id: string | null
          original_amount: number | null
          package_id: string | null
          parent_order_id: string | null
          payment_completed_at: string | null
          promo_code_id: string | null
          provider_cost: number | null
          provider_id: string | null
          provider_order_id: string | null
          provider_status: string | null
          purchased_for_user_id: string | null
          qr_code: string | null
          renewal_failure_count: number | null
          renewal_failure_reason: string | null
          renewal_payment_method_id: string | null
          service_tier: string | null
          short_code: string | null
          smdp_address: string | null
          status: string
          total_amount: number
          updated_at: string
          usage_cached_at: string | null
          user_id: string | null
          webhook_data: Json | null
        }
        Insert: {
          activation_code?: string | null
          affiliate_id?: string | null
          affiliate_session_id?: string | null
          auto_renewal_enabled?: boolean | null
          cached_installation?: Json | null
          cached_usage?: Json | null
          carrier_used?: string | null
          connection_quality_rating?: number | null
          created_at?: string
          currency?: string
          discount_amount?: number | null
          download_link?: string | null
          email_verified?: boolean
          environment?: string
          expiry_date?: string | null
          expiry_warning_sent_at?: string | null
          guest_email?: string | null
          guest_token?: string | null
          hidden_by_user?: boolean | null
          iccid?: string | null
          id?: string
          installation_cached_at?: string | null
          item_index?: number | null
          language?: string | null
          last_renewal_attempt_at?: string | null
          loyalty_processed?: boolean | null
          mobile11_money_applied?: number | null
          msisdn?: string | null
          notification_email?: string | null
          order_id: string
          organization_id?: string | null
          original_amount?: number | null
          package_id?: string | null
          parent_order_id?: string | null
          payment_completed_at?: string | null
          promo_code_id?: string | null
          provider_cost?: number | null
          provider_id?: string | null
          provider_order_id?: string | null
          provider_status?: string | null
          purchased_for_user_id?: string | null
          qr_code?: string | null
          renewal_failure_count?: number | null
          renewal_failure_reason?: string | null
          renewal_payment_method_id?: string | null
          service_tier?: string | null
          short_code?: string | null
          smdp_address?: string | null
          status?: string
          total_amount: number
          updated_at?: string
          usage_cached_at?: string | null
          user_id?: string | null
          webhook_data?: Json | null
        }
        Update: {
          activation_code?: string | null
          affiliate_id?: string | null
          affiliate_session_id?: string | null
          auto_renewal_enabled?: boolean | null
          cached_installation?: Json | null
          cached_usage?: Json | null
          carrier_used?: string | null
          connection_quality_rating?: number | null
          created_at?: string
          currency?: string
          discount_amount?: number | null
          download_link?: string | null
          email_verified?: boolean
          environment?: string
          expiry_date?: string | null
          expiry_warning_sent_at?: string | null
          guest_email?: string | null
          guest_token?: string | null
          hidden_by_user?: boolean | null
          iccid?: string | null
          id?: string
          installation_cached_at?: string | null
          item_index?: number | null
          language?: string | null
          last_renewal_attempt_at?: string | null
          loyalty_processed?: boolean | null
          mobile11_money_applied?: number | null
          msisdn?: string | null
          notification_email?: string | null
          order_id?: string
          organization_id?: string | null
          original_amount?: number | null
          package_id?: string | null
          parent_order_id?: string | null
          payment_completed_at?: string | null
          promo_code_id?: string | null
          provider_cost?: number | null
          provider_id?: string | null
          provider_order_id?: string | null
          provider_status?: string | null
          purchased_for_user_id?: string | null
          qr_code?: string | null
          renewal_failure_count?: number | null
          renewal_failure_reason?: string | null
          renewal_payment_method_id?: string | null
          service_tier?: string | null
          short_code?: string | null
          smdp_address?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          usage_cached_at?: string | null
          user_id?: string | null
          webhook_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "esim_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "esim_packages_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "esim_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          organization_id: string
          performed_by: string | null
          reference_id: string | null
          type: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          organization_id: string
          performed_by?: string | null
          reference_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          organization_id?: string
          performed_by?: string | null
          reference_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_credit_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_esim_assignments: {
        Row: {
          assigned_by: string | null
          assigned_to: string | null
          assignment_note: string | null
          created_at: string
          id: string
          order_id: string
          organization_id: string
          status: string
          trip_end_date: string | null
          trip_start_date: string | null
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          assigned_to?: string | null
          assignment_note?: string | null
          created_at?: string
          id?: string
          order_id: string
          organization_id: string
          status?: string
          trip_end_date?: string | null
          trip_start_date?: string | null
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          assigned_to?: string | null
          assignment_note?: string | null
          created_at?: string
          id?: string
          order_id?: string
          organization_id?: string
          status?: string
          trip_end_date?: string | null
          trip_start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_esim_assignments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_esim_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          department: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          department?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          department?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          department: string | null
          employee_id: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          is_active: boolean
          joined_at: string | null
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          employee_id?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string | null
          employee_id?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_orders: {
        Row: {
          cost_center: string | null
          created_at: string
          id: string
          notes: string | null
          order_id: string
          organization_id: string
          project_code: string | null
          purchased_by: string
        }
        Insert: {
          cost_center?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          organization_id: string
          project_code?: string | null
          purchased_by: string
        }
        Update: {
          cost_center?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          organization_id?: string
          project_code?: string | null
          purchased_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_topup_requests: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          created_by: string
          id: string
          organization_id: string
          payment_method: string
          payment_reference: string | null
          status: string
          stripe_session_id: string | null
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          created_by: string
          id?: string
          organization_id: string
          payment_method: string
          payment_reference?: string | null
          status?: string
          stripe_session_id?: string | null
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          organization_id?: string
          payment_method?: string
          payment_reference?: string | null
          status?: string
          stripe_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_topup_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          billing_address: Json | null
          billing_email: string
          company_size: string | null
          created_at: string
          created_by: string | null
          credit_balance: number | null
          credit_limit: number | null
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          settings: Json | null
          slug: string
          status: string
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          billing_address?: Json | null
          billing_email: string
          company_size?: string | null
          created_at?: string
          created_by?: string | null
          credit_balance?: number | null
          credit_limit?: number | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          settings?: Json | null
          slug: string
          status?: string
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          billing_address?: Json | null
          billing_email?: string
          company_size?: string | null
          created_at?: string
          created_by?: string | null
          credit_balance?: number | null
          credit_limit?: number | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          settings?: Json | null
          slug?: string
          status?: string
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      outbound_autonomy_audit_log: {
        Row: {
          action: string
          actor_type: string
          actor_user_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          request_id: string
        }
        Insert: {
          action: string
          actor_type: string
          actor_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          request_id: string
        }
        Update: {
          action?: string
          actor_type?: string
          actor_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outbound_autonomy_audit_log_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "outbound_autonomy_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      outbound_autonomy_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          baseline_metrics: Json | null
          campaign_id: string | null
          change_category: string
          change_payload: Json | null
          created_at: string | null
          created_by_type: string
          created_by_user_id: string | null
          current_metrics: Json | null
          description: string | null
          engine_version: string | null
          experiment_id: string | null
          id: string
          journey_id: string | null
          journey_step_id: string | null
          monitoring_window_days: number
          recommendation_id: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          risk_level: string
          rollback_evidence: Json | null
          rollback_triggered_by: string | null
          rolled_back_at: string | null
          rolled_back_by_type: string | null
          rolled_back_by_user_id: string | null
          rollout_pct: number | null
          rollout_started_at: string | null
          rule_id: string | null
          status: string
          template_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          baseline_metrics?: Json | null
          campaign_id?: string | null
          change_category: string
          change_payload?: Json | null
          created_at?: string | null
          created_by_type?: string
          created_by_user_id?: string | null
          current_metrics?: Json | null
          description?: string | null
          engine_version?: string | null
          experiment_id?: string | null
          id?: string
          journey_id?: string | null
          journey_step_id?: string | null
          monitoring_window_days?: number
          recommendation_id?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          risk_level: string
          rollback_evidence?: Json | null
          rollback_triggered_by?: string | null
          rolled_back_at?: string | null
          rolled_back_by_type?: string | null
          rolled_back_by_user_id?: string | null
          rollout_pct?: number | null
          rollout_started_at?: string | null
          rule_id?: string | null
          status?: string
          template_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          baseline_metrics?: Json | null
          campaign_id?: string | null
          change_category?: string
          change_payload?: Json | null
          created_at?: string | null
          created_by_type?: string
          created_by_user_id?: string | null
          current_metrics?: Json | null
          description?: string | null
          engine_version?: string | null
          experiment_id?: string | null
          id?: string
          journey_id?: string | null
          journey_step_id?: string | null
          monitoring_window_days?: number
          recommendation_id?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          risk_level?: string
          rollback_evidence?: Json | null
          rollback_triggered_by?: string | null
          rolled_back_at?: string | null
          rolled_back_by_type?: string | null
          rolled_back_by_user_id?: string | null
          rollout_pct?: number | null
          rollout_started_at?: string | null
          rule_id?: string | null
          status?: string
          template_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outbound_autonomy_requests_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "outbound_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_autonomy_requests_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "outbound_experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_autonomy_requests_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "outbound_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_autonomy_requests_journey_step_id_fkey"
            columns: ["journey_step_id"]
            isOneToOne: false
            referencedRelation: "outbound_journey_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_autonomy_requests_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "outbound_optimization_recommendations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_autonomy_requests_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "outbound_autonomy_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_autonomy_requests_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "outbound_message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      outbound_autonomy_rules: {
        Row: {
          auto_test_allowed: boolean | null
          change_category: string
          controlled_rollout_allowed: boolean | null
          cooldown_hours: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          manual_approval_required: boolean | null
          max_rollout_pct: number | null
          min_sample_size: number | null
          risk_level: string
          rollback_complaint_rise_pct: number | null
          rollback_conversion_drop_pct: number | null
          rollback_opt_out_rise_pct: number | null
          rollback_ticket_rise_pct: number | null
          rule_name: string
          updated_at: string | null
        }
        Insert: {
          auto_test_allowed?: boolean | null
          change_category: string
          controlled_rollout_allowed?: boolean | null
          cooldown_hours?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          manual_approval_required?: boolean | null
          max_rollout_pct?: number | null
          min_sample_size?: number | null
          risk_level?: string
          rollback_complaint_rise_pct?: number | null
          rollback_conversion_drop_pct?: number | null
          rollback_opt_out_rise_pct?: number | null
          rollback_ticket_rise_pct?: number | null
          rule_name: string
          updated_at?: string | null
        }
        Update: {
          auto_test_allowed?: boolean | null
          change_category?: string
          controlled_rollout_allowed?: boolean | null
          cooldown_hours?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          manual_approval_required?: boolean | null
          max_rollout_pct?: number | null
          min_sample_size?: number | null
          risk_level?: string
          rollback_complaint_rise_pct?: number | null
          rollback_conversion_drop_pct?: number | null
          rollback_opt_out_rise_pct?: number | null
          rollback_ticket_rise_pct?: number | null
          rule_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      outbound_campaigns: {
        Row: {
          allowed_channels: string[]
          campaign_name: string
          campaign_objective: string | null
          campaign_type: string
          created_at: string
          created_by: string | null
          end_at: string | null
          goal_metric: string | null
          id: string
          is_recovery_campaign: boolean
          max_sends: number | null
          metadata: Json
          preference_category: string | null
          priority: number
          scheduling_mode: string
          start_at: string | null
          status: string
          target_audience_definition: Json
          updated_at: string
        }
        Insert: {
          allowed_channels?: string[]
          campaign_name: string
          campaign_objective?: string | null
          campaign_type: string
          created_at?: string
          created_by?: string | null
          end_at?: string | null
          goal_metric?: string | null
          id?: string
          is_recovery_campaign?: boolean
          max_sends?: number | null
          metadata?: Json
          preference_category?: string | null
          priority?: number
          scheduling_mode?: string
          start_at?: string | null
          status?: string
          target_audience_definition?: Json
          updated_at?: string
        }
        Update: {
          allowed_channels?: string[]
          campaign_name?: string
          campaign_objective?: string | null
          campaign_type?: string
          created_at?: string
          created_by?: string | null
          end_at?: string | null
          goal_metric?: string | null
          id?: string
          is_recovery_campaign?: boolean
          max_sends?: number | null
          metadata?: Json
          preference_category?: string | null
          priority?: number
          scheduling_mode?: string
          start_at?: string | null
          status?: string
          target_audience_definition?: Json
          updated_at?: string
        }
        Relationships: []
      }
      outbound_experiment_results: {
        Row: {
          avg_post_send_rating: number | null
          click_rate: number | null
          clicked_count: number
          complaint_count: number
          conversion_rate: number | null
          converted_count: number
          delivered_count: number
          delivery_rate: number | null
          experiment_id: string
          id: string
          is_winner: boolean
          last_aggregated_at: string
          opted_out_count: number
          replied_count: number
          reply_rate: number | null
          seen_count: number
          sends_count: number
          total_conversion_value: number
          variant_id: string
        }
        Insert: {
          avg_post_send_rating?: number | null
          click_rate?: number | null
          clicked_count?: number
          complaint_count?: number
          conversion_rate?: number | null
          converted_count?: number
          delivered_count?: number
          delivery_rate?: number | null
          experiment_id: string
          id?: string
          is_winner?: boolean
          last_aggregated_at?: string
          opted_out_count?: number
          replied_count?: number
          reply_rate?: number | null
          seen_count?: number
          sends_count?: number
          total_conversion_value?: number
          variant_id: string
        }
        Update: {
          avg_post_send_rating?: number | null
          click_rate?: number | null
          clicked_count?: number
          complaint_count?: number
          conversion_rate?: number | null
          converted_count?: number
          delivered_count?: number
          delivery_rate?: number | null
          experiment_id?: string
          id?: string
          is_winner?: boolean
          last_aggregated_at?: string
          opted_out_count?: number
          replied_count?: number
          reply_rate?: number | null
          seen_count?: number
          sends_count?: number
          total_conversion_value?: number
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outbound_experiment_results_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "outbound_experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_experiment_results_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "outbound_message_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      outbound_experiment_variants: {
        Row: {
          allocation_weight: number
          created_at: string
          experiment_id: string
          id: string
          role: string
          variant_id: string
        }
        Insert: {
          allocation_weight?: number
          created_at?: string
          experiment_id: string
          id?: string
          role: string
          variant_id: string
        }
        Update: {
          allocation_weight?: number
          created_at?: string
          experiment_id?: string
          id?: string
          role?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outbound_experiment_variants_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "outbound_experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_experiment_variants_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "outbound_message_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      outbound_experiments: {
        Row: {
          campaign_type: string | null
          channel_type: string
          created_at: string
          created_by: string | null
          description: string | null
          ended_at: string | null
          experiment_name: string
          experiment_type: string
          id: string
          intent_type: string | null
          journey_id: string | null
          journey_step_id: string | null
          language: string | null
          metadata: Json
          min_improvement_pct: number
          min_sends_per_variant: number
          rollout_percentage: number
          started_at: string | null
          status: string
          stop_loss_metric: string | null
          stop_loss_threshold: number | null
          success_metric: string
          updated_at: string
          winner_variant_id: string | null
        }
        Insert: {
          campaign_type?: string | null
          channel_type: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ended_at?: string | null
          experiment_name: string
          experiment_type: string
          id?: string
          intent_type?: string | null
          journey_id?: string | null
          journey_step_id?: string | null
          language?: string | null
          metadata?: Json
          min_improvement_pct?: number
          min_sends_per_variant?: number
          rollout_percentage?: number
          started_at?: string | null
          status?: string
          stop_loss_metric?: string | null
          stop_loss_threshold?: number | null
          success_metric?: string
          updated_at?: string
          winner_variant_id?: string | null
        }
        Update: {
          campaign_type?: string | null
          channel_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ended_at?: string | null
          experiment_name?: string
          experiment_type?: string
          id?: string
          intent_type?: string | null
          journey_id?: string | null
          journey_step_id?: string | null
          language?: string | null
          metadata?: Json
          min_improvement_pct?: number
          min_sends_per_variant?: number
          rollout_percentage?: number
          started_at?: string | null
          status?: string
          stop_loss_metric?: string | null
          stop_loss_threshold?: number | null
          success_metric?: string
          updated_at?: string
          winner_variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outbound_experiments_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "outbound_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_experiments_journey_step_id_fkey"
            columns: ["journey_step_id"]
            isOneToOne: false
            referencedRelation: "outbound_journey_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_experiments_winner_variant_id_fkey"
            columns: ["winner_variant_id"]
            isOneToOne: false
            referencedRelation: "outbound_message_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      outbound_journey_steps: {
        Row: {
          action_if_converted: string
          action_if_no_reply: string
          action_if_replied: string
          ai_generate_message: boolean
          ai_generation_instructions: string | null
          branch_target_step: number | null
          channel_selection_rule: string
          created_at: string
          delay_before_hours: number
          id: string
          journey_id: string
          message_template_id: string | null
          metadata: Json
          specific_channel: string | null
          step_name: string
          step_order: number
          step_type: string
          updated_at: string
        }
        Insert: {
          action_if_converted?: string
          action_if_no_reply?: string
          action_if_replied?: string
          ai_generate_message?: boolean
          ai_generation_instructions?: string | null
          branch_target_step?: number | null
          channel_selection_rule?: string
          created_at?: string
          delay_before_hours?: number
          id?: string
          journey_id: string
          message_template_id?: string | null
          metadata?: Json
          specific_channel?: string | null
          step_name: string
          step_order: number
          step_type: string
          updated_at?: string
        }
        Update: {
          action_if_converted?: string
          action_if_no_reply?: string
          action_if_replied?: string
          ai_generate_message?: boolean
          ai_generation_instructions?: string | null
          branch_target_step?: number | null
          channel_selection_rule?: string
          created_at?: string
          delay_before_hours?: number
          id?: string
          journey_id?: string
          message_template_id?: string | null
          metadata?: Json
          specific_channel?: string | null
          step_name?: string
          step_order?: number
          step_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outbound_journey_steps_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "outbound_journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      outbound_journeys: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          journey_name: string
          max_steps: number | null
          metadata: Json
          status: string
          stop_conditions: Json
          trigger_definition: Json
          trigger_type: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          journey_name: string
          max_steps?: number | null
          metadata?: Json
          status?: string
          stop_conditions?: Json
          trigger_definition?: Json
          trigger_type: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          journey_name?: string
          max_steps?: number | null
          metadata?: Json
          status?: string
          stop_conditions?: Json
          trigger_definition?: Json
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outbound_journeys_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "outbound_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      outbound_learning_events: {
        Row: {
          campaign_id: string | null
          channel_type: string
          click_status: string
          complaint_flag: boolean
          conversion_status: string
          conversion_value: number | null
          created_at: string
          customer_profile_id: string
          delivery_status: string
          experiment_id: string | null
          id: string
          journey_id: string | null
          journey_step_id: string | null
          message_template_id: string | null
          metadata: Json
          opt_out_status: string
          post_send_rating: number | null
          reply_sentiment: string
          reply_status: string
          seen_status: string
          send_log_id: string
          sent_at: string | null
          stage_snapshot: Json
          support_ticket_created: boolean
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          channel_type: string
          click_status?: string
          complaint_flag?: boolean
          conversion_status?: string
          conversion_value?: number | null
          created_at?: string
          customer_profile_id: string
          delivery_status?: string
          experiment_id?: string | null
          id?: string
          journey_id?: string | null
          journey_step_id?: string | null
          message_template_id?: string | null
          metadata?: Json
          opt_out_status?: string
          post_send_rating?: number | null
          reply_sentiment?: string
          reply_status?: string
          seen_status?: string
          send_log_id: string
          sent_at?: string | null
          stage_snapshot?: Json
          support_ticket_created?: boolean
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          channel_type?: string
          click_status?: string
          complaint_flag?: boolean
          conversion_status?: string
          conversion_value?: number | null
          created_at?: string
          customer_profile_id?: string
          delivery_status?: string
          experiment_id?: string | null
          id?: string
          journey_id?: string | null
          journey_step_id?: string | null
          message_template_id?: string | null
          metadata?: Json
          opt_out_status?: string
          post_send_rating?: number | null
          reply_sentiment?: string
          reply_status?: string
          seen_status?: string
          send_log_id?: string
          sent_at?: string | null
          stage_snapshot?: Json
          support_ticket_created?: boolean
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outbound_learning_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "outbound_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_learning_events_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_learning_events_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "outbound_experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_learning_events_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "outbound_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_learning_events_journey_step_id_fkey"
            columns: ["journey_step_id"]
            isOneToOne: false
            referencedRelation: "outbound_journey_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_learning_events_message_template_id_fkey"
            columns: ["message_template_id"]
            isOneToOne: false
            referencedRelation: "outbound_message_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_learning_events_send_log_id_fkey"
            columns: ["send_log_id"]
            isOneToOne: true
            referencedRelation: "outbound_send_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_learning_events_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "outbound_message_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      outbound_message_templates: {
        Row: {
          campaign_type: string | null
          channel_type: string
          created_at: string | null
          cta_text: string | null
          cta_type: string | null
          cta_url: string | null
          email_subject: string | null
          id: string
          intent_type: string
          is_active: boolean | null
          language: string
          message_text: string
          metadata: Json | null
          supported_variables: Json | null
          template_name: string
          tone_type: string
          updated_at: string | null
          version_label: string | null
        }
        Insert: {
          campaign_type?: string | null
          channel_type: string
          created_at?: string | null
          cta_text?: string | null
          cta_type?: string | null
          cta_url?: string | null
          email_subject?: string | null
          id?: string
          intent_type: string
          is_active?: boolean | null
          language?: string
          message_text: string
          metadata?: Json | null
          supported_variables?: Json | null
          template_name: string
          tone_type?: string
          updated_at?: string | null
          version_label?: string | null
        }
        Update: {
          campaign_type?: string | null
          channel_type?: string
          created_at?: string | null
          cta_text?: string | null
          cta_type?: string | null
          cta_url?: string | null
          email_subject?: string | null
          id?: string
          intent_type?: string
          is_active?: boolean | null
          language?: string
          message_text?: string
          metadata?: Json | null
          supported_variables?: Json | null
          template_name?: string
          tone_type?: string
          updated_at?: string | null
          version_label?: string | null
        }
        Relationships: []
      }
      outbound_message_variants: {
        Row: {
          channel_type: string
          created_at: string
          cta_text: string | null
          cta_type: string | null
          email_subject: string | null
          id: string
          is_active: boolean
          language: string
          message_text: string
          metadata: Json
          style: string
          template_id: string
          updated_at: string
          variant_key: string
          variant_label: string
        }
        Insert: {
          channel_type: string
          created_at?: string
          cta_text?: string | null
          cta_type?: string | null
          email_subject?: string | null
          id?: string
          is_active?: boolean
          language: string
          message_text: string
          metadata?: Json
          style: string
          template_id: string
          updated_at?: string
          variant_key: string
          variant_label: string
        }
        Update: {
          channel_type?: string
          created_at?: string
          cta_text?: string | null
          cta_type?: string | null
          email_subject?: string | null
          id?: string
          is_active?: boolean
          language?: string
          message_text?: string
          metadata?: Json
          style?: string
          template_id?: string
          updated_at?: string
          variant_key?: string
          variant_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "outbound_message_variants_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "outbound_message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      outbound_next_best_actions: {
        Row: {
          capability_stage: string | null
          complaints_last_30d: number | null
          confidence_score: number
          created_at: string | null
          current_channel: string | null
          customer_profile_id: string
          engine_version: string | null
          executed_at: string | null
          experience_stage: string | null
          expires_at: string | null
          explanation: string
          funnel_stage: string | null
          id: string
          metadata: Json
          reasoning_factors: Json
          recent_sentiment: string | null
          recommended_action: string
          recommended_campaign_id: string | null
          recommended_channel: string | null
          recommended_delay_hours: number | null
          recommended_journey_id: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sends_last_7d: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          capability_stage?: string | null
          complaints_last_30d?: number | null
          confidence_score: number
          created_at?: string | null
          current_channel?: string | null
          customer_profile_id: string
          engine_version?: string | null
          executed_at?: string | null
          experience_stage?: string | null
          expires_at?: string | null
          explanation: string
          funnel_stage?: string | null
          id?: string
          metadata?: Json
          reasoning_factors?: Json
          recent_sentiment?: string | null
          recommended_action: string
          recommended_campaign_id?: string | null
          recommended_channel?: string | null
          recommended_delay_hours?: number | null
          recommended_journey_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sends_last_7d?: number | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          capability_stage?: string | null
          complaints_last_30d?: number | null
          confidence_score?: number
          created_at?: string | null
          current_channel?: string | null
          customer_profile_id?: string
          engine_version?: string | null
          executed_at?: string | null
          experience_stage?: string | null
          expires_at?: string | null
          explanation?: string
          funnel_stage?: string | null
          id?: string
          metadata?: Json
          reasoning_factors?: Json
          recent_sentiment?: string | null
          recommended_action?: string
          recommended_campaign_id?: string | null
          recommended_channel?: string | null
          recommended_delay_hours?: number | null
          recommended_journey_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sends_last_7d?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outbound_next_best_actions_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_next_best_actions_recommended_campaign_id_fkey"
            columns: ["recommended_campaign_id"]
            isOneToOne: false
            referencedRelation: "outbound_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_next_best_actions_recommended_journey_id_fkey"
            columns: ["recommended_journey_id"]
            isOneToOne: false
            referencedRelation: "outbound_journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      outbound_optimization_recommendations: {
        Row: {
          analysis_window_days: number
          campaign_id: string | null
          confidence_score: number | null
          created_at: string
          current_value: Json | null
          engine_version: string | null
          evidence: Json
          experiment_id: string | null
          explanation: string
          generated_by: string
          id: string
          impact_score: number | null
          implementation_notes: string | null
          implemented_at: string | null
          journey_id: string | null
          journey_step_id: string | null
          metadata: Json
          recommendation_type: string
          recommended_value: Json | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: string
          status: string
          template_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          analysis_window_days?: number
          campaign_id?: string | null
          confidence_score?: number | null
          created_at?: string
          current_value?: Json | null
          engine_version?: string | null
          evidence?: Json
          experiment_id?: string | null
          explanation: string
          generated_by?: string
          id?: string
          impact_score?: number | null
          implementation_notes?: string | null
          implemented_at?: string | null
          journey_id?: string | null
          journey_step_id?: string | null
          metadata?: Json
          recommendation_type: string
          recommended_value?: Json | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          template_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          analysis_window_days?: number
          campaign_id?: string | null
          confidence_score?: number | null
          created_at?: string
          current_value?: Json | null
          engine_version?: string | null
          evidence?: Json
          experiment_id?: string | null
          explanation?: string
          generated_by?: string
          id?: string
          impact_score?: number | null
          implementation_notes?: string | null
          implemented_at?: string | null
          journey_id?: string | null
          journey_step_id?: string | null
          metadata?: Json
          recommendation_type?: string
          recommended_value?: Json | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          template_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outbound_optimization_recommendations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "outbound_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_optimization_recommendations_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "outbound_experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_optimization_recommendations_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "outbound_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_optimization_recommendations_journey_step_id_fkey"
            columns: ["journey_step_id"]
            isOneToOne: false
            referencedRelation: "outbound_journey_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_optimization_recommendations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "outbound_message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      outbound_send_logs: {
        Row: {
          campaign_id: string | null
          channel_type: string
          click_status: string
          clicked_at: string | null
          conversion_status: string
          converted_at: string | null
          created_at: string
          customer_profile_id: string
          delivered_at: string | null
          delivery_status: string
          email_subject: string | null
          enrollment_id: string | null
          external_message_id: string | null
          failure_reason: string | null
          id: string
          journey_id: string | null
          journey_step_id: string | null
          message_template_id: string | null
          metadata: Json
          provider_name: string | null
          rendered_content: string | null
          replied_at: string | null
          reply_status: string
          send_attempt_number: number
          send_queue_id: string | null
          send_status: string
          sent_at: string | null
        }
        Insert: {
          campaign_id?: string | null
          channel_type: string
          click_status?: string
          clicked_at?: string | null
          conversion_status?: string
          converted_at?: string | null
          created_at?: string
          customer_profile_id: string
          delivered_at?: string | null
          delivery_status?: string
          email_subject?: string | null
          enrollment_id?: string | null
          external_message_id?: string | null
          failure_reason?: string | null
          id?: string
          journey_id?: string | null
          journey_step_id?: string | null
          message_template_id?: string | null
          metadata?: Json
          provider_name?: string | null
          rendered_content?: string | null
          replied_at?: string | null
          reply_status?: string
          send_attempt_number?: number
          send_queue_id?: string | null
          send_status?: string
          sent_at?: string | null
        }
        Update: {
          campaign_id?: string | null
          channel_type?: string
          click_status?: string
          clicked_at?: string | null
          conversion_status?: string
          converted_at?: string | null
          created_at?: string
          customer_profile_id?: string
          delivered_at?: string | null
          delivery_status?: string
          email_subject?: string | null
          enrollment_id?: string | null
          external_message_id?: string | null
          failure_reason?: string | null
          id?: string
          journey_id?: string | null
          journey_step_id?: string | null
          message_template_id?: string | null
          metadata?: Json
          provider_name?: string | null
          rendered_content?: string | null
          replied_at?: string | null
          reply_status?: string
          send_attempt_number?: number
          send_queue_id?: string | null
          send_status?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outbound_send_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "outbound_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_send_logs_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_send_logs_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "journey_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_send_logs_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "outbound_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_send_logs_journey_step_id_fkey"
            columns: ["journey_step_id"]
            isOneToOne: false
            referencedRelation: "outbound_journey_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_send_logs_send_queue_id_fkey"
            columns: ["send_queue_id"]
            isOneToOne: false
            referencedRelation: "outbound_send_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      outbound_send_queue: {
        Row: {
          attempt_count: number
          channel_type: string
          created_at: string
          customer_profile_id: string
          enrollment_id: string
          failure_reason: string | null
          id: string
          journey_step_id: string
          last_attempt_at: string | null
          max_attempts: number
          message_template_id: string | null
          resolved_at: string | null
          scheduled_send_at: string
          status: string
          suppression_reason: string | null
        }
        Insert: {
          attempt_count?: number
          channel_type: string
          created_at?: string
          customer_profile_id: string
          enrollment_id: string
          failure_reason?: string | null
          id?: string
          journey_step_id: string
          last_attempt_at?: string | null
          max_attempts?: number
          message_template_id?: string | null
          resolved_at?: string | null
          scheduled_send_at: string
          status?: string
          suppression_reason?: string | null
        }
        Update: {
          attempt_count?: number
          channel_type?: string
          created_at?: string
          customer_profile_id?: string
          enrollment_id?: string
          failure_reason?: string | null
          id?: string
          journey_step_id?: string
          last_attempt_at?: string | null
          max_attempts?: number
          message_template_id?: string | null
          resolved_at?: string | null
          scheduled_send_at?: string
          status?: string
          suppression_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outbound_send_queue_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_send_queue_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "journey_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_send_queue_journey_step_id_fkey"
            columns: ["journey_step_id"]
            isOneToOne: false
            referencedRelation: "outbound_journey_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      outbound_suppression_logs: {
        Row: {
          campaign_id: string | null
          channel_type: string | null
          created_at: string
          customer_profile_id: string
          id: string
          metadata: Json
          suppression_reason: string
        }
        Insert: {
          campaign_id?: string | null
          channel_type?: string | null
          created_at?: string
          customer_profile_id: string
          id?: string
          metadata?: Json
          suppression_reason: string
        }
        Update: {
          campaign_id?: string | null
          channel_type?: string | null
          created_at?: string
          customer_profile_id?: string
          id?: string
          metadata?: Json
          suppression_reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "outbound_suppression_logs_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      package_display_settings: {
        Row: {
          created_at: string | null
          display_name: string
          display_order: number | null
          field_category: string | null
          field_name: string
          id: string
          is_visible: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name: string
          display_order?: number | null
          field_category?: string | null
          field_name: string
          id?: string
          is_visible?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string
          display_order?: number | null
          field_category?: string | null
          field_name?: string
          id?: string
          is_visible?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      package_quality_reports: {
        Row: {
          carrier_used: string | null
          country_used: string | null
          created_at: string | null
          id: string
          is_complaint: boolean | null
          issue_type: string | null
          location_description: string | null
          notes: string | null
          order_id: string | null
          overall_rating: number | null
          package_id: string | null
          reliability_rating: number | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          speed_rating: number | null
          user_id: string | null
        }
        Insert: {
          carrier_used?: string | null
          country_used?: string | null
          created_at?: string | null
          id?: string
          is_complaint?: boolean | null
          issue_type?: string | null
          location_description?: string | null
          notes?: string | null
          order_id?: string | null
          overall_rating?: number | null
          package_id?: string | null
          reliability_rating?: number | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          speed_rating?: number | null
          user_id?: string | null
        }
        Update: {
          carrier_used?: string | null
          country_used?: string | null
          created_at?: string | null
          id?: string
          is_complaint?: boolean | null
          issue_type?: string | null
          location_description?: string | null
          notes?: string | null
          order_id?: string | null
          overall_rating?: number | null
          package_id?: string | null
          reliability_rating?: number | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          speed_rating?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "package_quality_reports_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_quality_reports_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "esim_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_quality_reports_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "esim_packages_public"
            referencedColumns: ["id"]
          },
        ]
      }
      page_events: {
        Row: {
          duration_seconds: number | null
          entered_at: string | null
          event_detail: string | null
          event_type: string
          id: string
          left_at: string | null
          page_path: string | null
          page_title: string | null
          scroll_depth_percent: number | null
          session_id: string
        }
        Insert: {
          duration_seconds?: number | null
          entered_at?: string | null
          event_detail?: string | null
          event_type?: string
          id?: string
          left_at?: string | null
          page_path?: string | null
          page_title?: string | null
          scroll_depth_percent?: number | null
          session_id: string
        }
        Update: {
          duration_seconds?: number | null
          entered_at?: string | null
          event_detail?: string | null
          event_type?: string
          id?: string
          left_at?: string | null
          page_path?: string | null
          page_title?: string | null
          scroll_depth_percent?: number | null
          session_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          order_id: string
          payment_gateway: string | null
          payment_intent_id: string | null
          payment_method: string | null
          payment_reference: string | null
          qr_code_data: string | null
          qr_code_image_url: string | null
          qr_expires_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          order_id: string
          payment_gateway?: string | null
          payment_intent_id?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          qr_code_data?: string | null
          qr_code_image_url?: string | null
          qr_expires_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          order_id?: string
          payment_gateway?: string | null
          payment_intent_id?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          qr_code_data?: string | null
          qr_code_image_url?: string | null
          qr_expires_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_kb_suggestions: {
        Row: {
          ai_confidence: number
          ai_suggested_answer: string
          conversation_id: string | null
          created_at: string
          id: string
          language: string
          message_id: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_question: string
        }
        Insert: {
          ai_confidence?: number
          ai_suggested_answer: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          language?: string
          message_id?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_question: string
        }
        Update: {
          ai_confidence?: number
          ai_suggested_answer?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          language?: string
          message_id?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_question?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_kb_suggestions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_kb_suggestions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      post_payment_verifications: {
        Row: {
          attempts: number
          code_hash: string
          created_at: string
          email: string
          expires_at: string
          id: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          attempts?: number
          code_hash: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          attempts?: number
          code_hash?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      price_file_uploads: {
        Row: {
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          is_active: boolean | null
          notes: string | null
          packages_count: number | null
          sheet_name: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          packages_count?: number | null
          sheet_name?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          packages_count?: number | null
          sheet_name?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          auth_provider: string | null
          created_at: string
          email: string
          facebook_psid: string | null
          first_name: string | null
          id: string
          last_name: string | null
          line_display_name: string | null
          line_picture_url: string | null
          line_user_id: string | null
          phone: string | null
          promotional_emails: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auth_provider?: string | null
          created_at?: string
          email: string
          facebook_psid?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          line_display_name?: string | null
          line_picture_url?: string | null
          line_user_id?: string | null
          phone?: string | null
          promotional_emails?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auth_provider?: string | null
          created_at?: string
          email?: string
          facebook_psid?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          line_display_name?: string | null
          line_picture_url?: string | null
          line_user_id?: string | null
          phone?: string | null
          promotional_emails?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_campaigns: {
        Row: {
          banner_content: Json | null
          banner_image_url: string | null
          banner_type: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          display_pages: string[] | null
          end_date: string | null
          id: string
          name: string
          start_date: string
          status: string | null
          target_audience: string | null
          updated_at: string | null
        }
        Insert: {
          banner_content?: Json | null
          banner_image_url?: string | null
          banner_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_pages?: string[] | null
          end_date?: string | null
          id?: string
          name: string
          start_date: string
          status?: string | null
          target_audience?: string | null
          updated_at?: string | null
        }
        Update: {
          banner_content?: Json | null
          banner_image_url?: string | null
          banner_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_pages?: string[] | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string
          status?: string | null
          target_audience?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      promo_code_usage: {
        Row: {
          discount_applied: number
          id: string
          order_id: string
          promo_code_id: string
          used_at: string
          user_id: string
        }
        Insert: {
          discount_applied: number
          id?: string
          order_id: string
          promo_code_id: string
          used_at?: string
          user_id: string
        }
        Update: {
          discount_applied?: number
          id?: string
          order_id?: string
          promo_code_id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_usage_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          campaign_id: string | null
          code: string
          created_at: string
          created_by: string | null
          currency: string
          current_uses: number
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          max_uses: number | null
          topup_amount: number | null
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          campaign_id?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          currency?: string
          current_uses?: number
          description?: string | null
          discount_type: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          topup_amount?: number | null
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          campaign_id?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          current_uses?: number
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          topup_amount?: number | null
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "promo_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_experiment_results: {
        Row: {
          avg_ai_score: number | null
          avg_customer_rating: number | null
          containment_rate: number | null
          conversations_count: number
          conversion_rate: number | null
          created_at: string
          dead_air_rate: number | null
          experiment_id: string
          human_handoff_rate: number | null
          id: string
          is_winner: boolean | null
          prompt_version_id: string | null
          repeat_contact_rate: number | null
          updated_at: string
        }
        Insert: {
          avg_ai_score?: number | null
          avg_customer_rating?: number | null
          containment_rate?: number | null
          conversations_count?: number
          conversion_rate?: number | null
          created_at?: string
          dead_air_rate?: number | null
          experiment_id: string
          human_handoff_rate?: number | null
          id?: string
          is_winner?: boolean | null
          prompt_version_id?: string | null
          repeat_contact_rate?: number | null
          updated_at?: string
        }
        Update: {
          avg_ai_score?: number | null
          avg_customer_rating?: number | null
          containment_rate?: number | null
          conversations_count?: number
          conversion_rate?: number | null
          created_at?: string
          dead_air_rate?: number | null
          experiment_id?: string
          human_handoff_rate?: number | null
          id?: string
          is_winner?: boolean | null
          prompt_version_id?: string | null
          repeat_contact_rate?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_experiment_results_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "prompt_experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_experiment_results_prompt_version_id_fkey"
            columns: ["prompt_version_id"]
            isOneToOne: false
            referencedRelation: "prompt_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_experiments: {
        Row: {
          candidate_prompt_version_id: string | null
          control_prompt_version_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ended_at: string | null
          experiment_name: string
          id: string
          min_conversations: number
          prompt_type: string
          rollout_percentage: number
          started_at: string | null
          status: Database["public"]["Enums"]["experiment_status"]
          stop_loss_metric: string | null
          stop_loss_rule: string | null
          stop_loss_threshold: number | null
          stop_loss_triggered: boolean
          success_metric: string | null
          target_channels: string[] | null
          target_intents: string[] | null
          updated_at: string
          winner_version_id: string | null
        }
        Insert: {
          candidate_prompt_version_id?: string | null
          control_prompt_version_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ended_at?: string | null
          experiment_name: string
          id?: string
          min_conversations?: number
          prompt_type: string
          rollout_percentage?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["experiment_status"]
          stop_loss_metric?: string | null
          stop_loss_rule?: string | null
          stop_loss_threshold?: number | null
          stop_loss_triggered?: boolean
          success_metric?: string | null
          target_channels?: string[] | null
          target_intents?: string[] | null
          updated_at?: string
          winner_version_id?: string | null
        }
        Update: {
          candidate_prompt_version_id?: string | null
          control_prompt_version_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ended_at?: string | null
          experiment_name?: string
          id?: string
          min_conversations?: number
          prompt_type?: string
          rollout_percentage?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["experiment_status"]
          stop_loss_metric?: string | null
          stop_loss_rule?: string | null
          stop_loss_threshold?: number | null
          stop_loss_triggered?: boolean
          success_metric?: string | null
          target_channels?: string[] | null
          target_intents?: string[] | null
          updated_at?: string
          winner_version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_experiments_candidate_prompt_version_id_fkey"
            columns: ["candidate_prompt_version_id"]
            isOneToOne: false
            referencedRelation: "prompt_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_experiments_control_prompt_version_id_fkey"
            columns: ["control_prompt_version_id"]
            isOneToOne: false
            referencedRelation: "prompt_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_experiments_winner_version_id_fkey"
            columns: ["winner_version_id"]
            isOneToOne: false
            referencedRelation: "prompt_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_versions: {
        Row: {
          channel_scope: string[] | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          intent_scope: string[] | null
          is_active: boolean
          language: string | null
          model_scope: string[] | null
          prompt_text: string
          prompt_type: string
          updated_at: string
          version_name: string
        }
        Insert: {
          channel_scope?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          intent_scope?: string[] | null
          is_active?: boolean
          language?: string | null
          model_scope?: string[] | null
          prompt_text: string
          prompt_type: string
          updated_at?: string
          version_name: string
        }
        Update: {
          channel_scope?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          intent_scope?: string[] | null
          is_active?: boolean
          language?: string | null
          model_scope?: string[] | null
          prompt_text?: string
          prompt_type?: string
          updated_at?: string
          version_name?: string
        }
        Relationships: []
      }
      provider_apn_config: {
        Row: {
          alternative_apns: string[] | null
          apn_password: string | null
          apn_type: string | null
          apn_username: string | null
          country_code: string | null
          created_at: string | null
          hotspot_apn: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          primary_apn: string
          priority: number | null
          provider_id: string
          region_code: string | null
          updated_at: string | null
        }
        Insert: {
          alternative_apns?: string[] | null
          apn_password?: string | null
          apn_type?: string | null
          apn_username?: string | null
          country_code?: string | null
          created_at?: string | null
          hotspot_apn?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          primary_apn: string
          priority?: number | null
          provider_id: string
          region_code?: string | null
          updated_at?: string | null
        }
        Update: {
          alternative_apns?: string[] | null
          apn_password?: string | null
          apn_type?: string | null
          apn_username?: string | null
          country_code?: string | null
          created_at?: string | null
          hotspot_apn?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          primary_apn?: string
          priority?: number | null
          provider_id?: string
          region_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_apn_config_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "esim_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_billing: {
        Row: {
          avg_cost_per_gb: number | null
          avg_margin_percentage: number | null
          billing_period: string
          created_at: string | null
          failed_orders: number | null
          id: string
          provider_id: string
          successful_orders: number | null
          total_cost: number | null
          total_orders: number | null
          total_profit: number | null
          total_revenue: number | null
          updated_at: string | null
        }
        Insert: {
          avg_cost_per_gb?: number | null
          avg_margin_percentage?: number | null
          billing_period: string
          created_at?: string | null
          failed_orders?: number | null
          id?: string
          provider_id: string
          successful_orders?: number | null
          total_cost?: number | null
          total_orders?: number | null
          total_profit?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_cost_per_gb?: number | null
          avg_margin_percentage?: number | null
          billing_period?: string
          created_at?: string | null
          failed_orders?: number | null
          id?: string
          provider_id?: string
          successful_orders?: number | null
          total_cost?: number | null
          total_orders?: number | null
          total_profit?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_billing_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "esim_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_package_mapping: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          provider_id: string
          provider_term: string
          standard_type: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          provider_id: string
          provider_term: string
          standard_type: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          provider_id?: string
          provider_term?: string
          standard_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_package_mapping_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "esim_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      push_devices: {
        Row: {
          app_version: string | null
          created_at: string
          device_model: string | null
          id: string
          last_seen_at: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          app_version?: string | null
          created_at?: string
          device_model?: string | null
          id?: string
          last_seen_at?: string
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          app_version?: string | null
          created_at?: string
          device_model?: string | null
          id?: string
          last_seen_at?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      renewal_logs: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          error_message: string | null
          id: string
          new_order_id: string | null
          order_id: string
          status: string
          stripe_payment_intent_id: string | null
          triggered_by: string | null
          usage_at_renewal: Json | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          error_message?: string | null
          id?: string
          new_order_id?: string | null
          order_id: string
          status: string
          stripe_payment_intent_id?: string | null
          triggered_by?: string | null
          usage_at_renewal?: Json | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          error_message?: string | null
          id?: string
          new_order_id?: string | null
          order_id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          triggered_by?: string | null
          usage_at_renewal?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "renewal_logs_new_order_id_fkey"
            columns: ["new_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renewal_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduler_run_logs: {
        Row: {
          completed_at: string | null
          details: Json
          enrollments_evaluated: number
          errors: number
          id: string
          run_mode: string
          sends_queued: number
          sends_skipped: number
          sends_suppressed: number
          started_at: string
        }
        Insert: {
          completed_at?: string | null
          details?: Json
          enrollments_evaluated?: number
          errors?: number
          id?: string
          run_mode?: string
          sends_queued?: number
          sends_skipped?: number
          sends_suppressed?: number
          started_at?: string
        }
        Update: {
          completed_at?: string | null
          details?: Json
          enrollments_evaluated?: number
          errors?: number
          id?: string
          run_mode?: string
          sends_queued?: number
          sends_skipped?: number
          sends_suppressed?: number
          started_at?: string
        }
        Relationships: []
      }
      spam_filter_rules: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          match_in: string[] | null
          rule_type: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          match_in?: string[] | null
          rule_type: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          match_in?: string[] | null
          rule_type?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      spam_log: {
        Row: {
          classification: string | null
          classification_metadata: Json | null
          created_at: string | null
          from_email: string
          id: string
          matched_rules: string[] | null
          message_preview: string | null
          raw_payload: Json | null
          subject: string | null
          to_email: string | null
        }
        Insert: {
          classification?: string | null
          classification_metadata?: Json | null
          created_at?: string | null
          from_email: string
          id?: string
          matched_rules?: string[] | null
          message_preview?: string | null
          raw_payload?: Json | null
          subject?: string | null
          to_email?: string | null
        }
        Update: {
          classification?: string | null
          classification_metadata?: Json | null
          created_at?: string | null
          from_email?: string
          id?: string
          matched_rules?: string[] | null
          message_preview?: string | null
          raw_payload?: Json | null
          subject?: string | null
          to_email?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          auto_escalated: boolean | null
          auto_escalated_at: string | null
          category: string
          created_at: string
          email: string
          first_response_at: string | null
          id: string
          initial_priority: string | null
          name: string
          priority: string
          priority_changed_at: string | null
          priority_changed_by: string | null
          resolved_at: string | null
          status: string
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          auto_escalated?: boolean | null
          auto_escalated_at?: string | null
          category?: string
          created_at?: string
          email: string
          first_response_at?: string | null
          id?: string
          initial_priority?: string | null
          name: string
          priority?: string
          priority_changed_at?: string | null
          priority_changed_by?: string | null
          resolved_at?: string | null
          status?: string
          subject: string
          ticket_number: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          auto_escalated?: boolean | null
          auto_escalated_at?: string | null
          category?: string
          created_at?: string
          email?: string
          first_response_at?: string | null
          id?: string
          initial_priority?: string | null
          name?: string
          priority?: string
          priority_changed_at?: string | null
          priority_changed_by?: string | null
          resolved_at?: string | null
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      sync_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration_seconds: number | null
          error_details: Json | null
          error_message: string | null
          id: string
          job_type: string
          metadata: Json | null
          next_scheduled_at: string | null
          provider_id: string
          records_created: number | null
          records_failed: number | null
          records_processed: number | null
          records_updated: number | null
          started_at: string
          status: string
          triggered_by: string | null
          triggered_by_user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          job_type?: string
          metadata?: Json | null
          next_scheduled_at?: string | null
          provider_id: string
          records_created?: number | null
          records_failed?: number | null
          records_processed?: number | null
          records_updated?: number | null
          started_at?: string
          status?: string
          triggered_by?: string | null
          triggered_by_user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          job_type?: string
          metadata?: Json | null
          next_scheduled_at?: string | null
          provider_id?: string
          records_created?: number | null
          records_failed?: number | null
          records_processed?: number | null
          records_updated?: number | null
          started_at?: string
          status?: string
          triggered_by?: string | null
          triggered_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sync_jobs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "esim_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      system_config: {
        Row: {
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          category: string
          created_at: string | null
          data_type: string
          description: string | null
          id: string
          is_public: boolean | null
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          category: string
          created_at?: string | null
          data_type: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          category?: string
          created_at?: string | null
          data_type?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      telecom_event_log: {
        Row: {
          actor_id: string | null
          actor_type: string
          created_at: string
          entity_id: string
          entity_type: string
          event_data: Json | null
          event_type: string
          id: string
        }
        Insert: {
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          entity_id: string
          entity_type: string
          event_data?: Json | null
          event_type: string
          id?: string
        }
        Update: {
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          event_data?: Json | null
          event_type?: string
          id?: string
        }
        Relationships: []
      }
      telecom_plans: {
        Row: {
          created_at: string
          currency: string
          data_limit_mb: number | null
          id: string
          is_active: boolean
          metadata: Json | null
          monthly_cost: number | null
          plan_code: string | null
          plan_name: string
          plan_type: string
          provider_id: string | null
          retail_price: number | null
          sim_type: string
          sms_limit: number | null
          speed_tier: string | null
          updated_at: string
          validity_days: number | null
          voice_minutes: number | null
        }
        Insert: {
          created_at?: string
          currency?: string
          data_limit_mb?: number | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          monthly_cost?: number | null
          plan_code?: string | null
          plan_name: string
          plan_type?: string
          provider_id?: string | null
          retail_price?: number | null
          sim_type?: string
          sms_limit?: number | null
          speed_tier?: string | null
          updated_at?: string
          validity_days?: number | null
          voice_minutes?: number | null
        }
        Update: {
          created_at?: string
          currency?: string
          data_limit_mb?: number | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          monthly_cost?: number | null
          plan_code?: string | null
          plan_name?: string
          plan_type?: string
          provider_id?: string | null
          retail_price?: number | null
          sim_type?: string
          sms_limit?: number | null
          speed_tier?: string | null
          updated_at?: string
          validity_days?: number | null
          voice_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "telecom_plans_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "esim_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      telecom_provider_jobs: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          job_type: string
          max_attempts: number
          next_retry_at: string | null
          provider_id: string | null
          request_payload: Json | null
          response_payload: Json | null
          sim_card_id: string
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          job_type: string
          max_attempts?: number
          next_retry_at?: string | null
          provider_id?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          sim_card_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          job_type?: string
          max_attempts?: number
          next_retry_at?: string | null
          provider_id?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          sim_card_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "telecom_provider_jobs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "esim_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telecom_provider_jobs_sim_card_id_fkey"
            columns: ["sim_card_id"]
            isOneToOne: false
            referencedRelation: "telecom_sim_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      telecom_sim_cards: {
        Row: {
          activation_date: string | null
          assigned_org_id: string | null
          assigned_user_id: string | null
          batch_id: string | null
          created_at: string
          deactivation_date: string | null
          iccid: string | null
          id: string
          imsi: string | null
          metadata: Json | null
          mno_reference_id: string | null
          msisdn: string | null
          order_id: string | null
          provider_id: string | null
          sim_type: string
          status: string
          updated_at: string
        }
        Insert: {
          activation_date?: string | null
          assigned_org_id?: string | null
          assigned_user_id?: string | null
          batch_id?: string | null
          created_at?: string
          deactivation_date?: string | null
          iccid?: string | null
          id?: string
          imsi?: string | null
          metadata?: Json | null
          mno_reference_id?: string | null
          msisdn?: string | null
          order_id?: string | null
          provider_id?: string | null
          sim_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          activation_date?: string | null
          assigned_org_id?: string | null
          assigned_user_id?: string | null
          batch_id?: string | null
          created_at?: string
          deactivation_date?: string | null
          iccid?: string | null
          id?: string
          imsi?: string | null
          metadata?: Json | null
          mno_reference_id?: string | null
          msisdn?: string | null
          order_id?: string | null
          provider_id?: string | null
          sim_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "telecom_sim_cards_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telecom_sim_cards_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "esim_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      telecom_subscriptions: {
        Row: {
          assigned_org_id: string | null
          assigned_user_id: string | null
          auto_renew: boolean
          created_at: string
          end_date: string | null
          id: string
          metadata: Json | null
          next_renewal_date: string | null
          plan_id: string
          sim_card_id: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_org_id?: string | null
          assigned_user_id?: string | null
          auto_renew?: boolean
          created_at?: string
          end_date?: string | null
          id?: string
          metadata?: Json | null
          next_renewal_date?: string | null
          plan_id: string
          sim_card_id: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_org_id?: string | null
          assigned_user_id?: string | null
          auto_renew?: boolean
          created_at?: string
          end_date?: string | null
          id?: string
          metadata?: Json | null
          next_renewal_date?: string | null
          plan_id?: string
          sim_card_id?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "telecom_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "telecom_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telecom_subscriptions_sim_card_id_fkey"
            columns: ["sim_card_id"]
            isOneToOne: false
            referencedRelation: "telecom_sim_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      telecom_transactions: {
        Row: {
          amount: number | null
          created_at: string
          currency: string
          id: string
          initiated_by: string | null
          metadata: Json | null
          mno_transaction_id: string | null
          notes: string | null
          sim_card_id: string
          status: string
          subscription_id: string | null
          transaction_type: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string
          id?: string
          initiated_by?: string | null
          metadata?: Json | null
          mno_transaction_id?: string | null
          notes?: string | null
          sim_card_id: string
          status?: string
          subscription_id?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string
          id?: string
          initiated_by?: string | null
          metadata?: Json | null
          mno_transaction_id?: string | null
          notes?: string | null
          sim_card_id?: string
          status?: string
          subscription_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "telecom_transactions_sim_card_id_fkey"
            columns: ["sim_card_id"]
            isOneToOne: false
            referencedRelation: "telecom_sim_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telecom_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "telecom_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      telecom_usage_records: {
        Row: {
          created_at: string
          data_remaining_mb: number | null
          data_used_mb: number | null
          id: string
          mno_sync_id: string | null
          record_date: string
          sim_card_id: string
          sms_used: number | null
          subscription_id: string | null
          sync_source: string
          voice_used_minutes: number | null
        }
        Insert: {
          created_at?: string
          data_remaining_mb?: number | null
          data_used_mb?: number | null
          id?: string
          mno_sync_id?: string | null
          record_date?: string
          sim_card_id: string
          sms_used?: number | null
          subscription_id?: string | null
          sync_source?: string
          voice_used_minutes?: number | null
        }
        Update: {
          created_at?: string
          data_remaining_mb?: number | null
          data_used_mb?: number | null
          id?: string
          mno_sync_id?: string | null
          record_date?: string
          sim_card_id?: string
          sms_used?: number | null
          subscription_id?: string | null
          sync_source?: string
          voice_used_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "telecom_usage_records_sim_card_id_fkey"
            columns: ["sim_card_id"]
            isOneToOne: false
            referencedRelation: "telecom_sim_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telecom_usage_records_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "telecom_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      territories: {
        Row: {
          available_packages: string[] | null
          contract_reference: string | null
          contract_status: string
          country_code: string
          country_name: string
          created_at: string | null
          default_language: string
          distributor_id: string | null
          enabled_channels: string[] | null
          end_date: string | null
          exclusivity_model: string
          id: string
          is_active: boolean | null
          legal_notes: string | null
          local_currency: string
          local_price_rules: Json | null
          metadata: Json | null
          monthly_orders: number | null
          monthly_revenue: number | null
          monthly_support_tickets: number | null
          region: string | null
          start_date: string | null
          support_routing: Json | null
          tax_notes: string | null
          territory_name: string
          updated_at: string | null
        }
        Insert: {
          available_packages?: string[] | null
          contract_reference?: string | null
          contract_status?: string
          country_code: string
          country_name: string
          created_at?: string | null
          default_language?: string
          distributor_id?: string | null
          enabled_channels?: string[] | null
          end_date?: string | null
          exclusivity_model?: string
          id?: string
          is_active?: boolean | null
          legal_notes?: string | null
          local_currency?: string
          local_price_rules?: Json | null
          metadata?: Json | null
          monthly_orders?: number | null
          monthly_revenue?: number | null
          monthly_support_tickets?: number | null
          region?: string | null
          start_date?: string | null
          support_routing?: Json | null
          tax_notes?: string | null
          territory_name: string
          updated_at?: string | null
        }
        Update: {
          available_packages?: string[] | null
          contract_reference?: string | null
          contract_status?: string
          country_code?: string
          country_name?: string
          created_at?: string | null
          default_language?: string
          distributor_id?: string | null
          enabled_channels?: string[] | null
          end_date?: string | null
          exclusivity_model?: string
          id?: string
          is_active?: boolean | null
          legal_notes?: string | null
          local_currency?: string
          local_price_rules?: Json | null
          metadata?: Json | null
          monthly_orders?: number | null
          monthly_revenue?: number | null
          monthly_support_tickets?: number | null
          region?: string | null
          start_date?: string | null
          support_routing?: Json | null
          tax_notes?: string | null
          territory_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "territories_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      territory_packages: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          local_price_override: number | null
          package_id: string
          territory_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          local_price_override?: number | null
          package_id: string
          territory_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          local_price_override?: number | null
          package_id?: string
          territory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "territory_packages_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "esim_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "territory_packages_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "esim_packages_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "territory_packages_territory_id_fkey"
            columns: ["territory_id"]
            isOneToOne: false
            referencedRelation: "territories"
            referencedColumns: ["id"]
          },
        ]
      }
      territory_partners: {
        Row: {
          assigned_at: string | null
          id: string
          is_active: boolean | null
          partner_id: string
          partner_type: string
          role: string | null
          territory_id: string
        }
        Insert: {
          assigned_at?: string | null
          id?: string
          is_active?: boolean | null
          partner_id: string
          partner_type: string
          role?: string | null
          territory_id: string
        }
        Update: {
          assigned_at?: string | null
          id?: string
          is_active?: boolean | null
          partner_id?: string
          partner_type?: string
          role?: string | null
          territory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "territory_partners_territory_id_fkey"
            columns: ["territory_id"]
            isOneToOne: false
            referencedRelation: "territories"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          icon: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          attachments: Json | null
          created_at: string
          id: string
          is_internal_note: boolean
          message: string
          sender_type: string
          ticket_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_internal_note?: boolean
          message: string
          sender_type?: string
          ticket_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_internal_note?: boolean
          message?: string
          sender_type?: string
          ticket_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      translation_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          message_count: number
          messages: Json
          source_language: string
          target_language: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          message_count?: number
          messages?: Json
          source_language: string
          target_language: string
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          message_count?: number
          messages?: Json
          source_language?: string
          target_language?: string
          user_id?: string
        }
        Relationships: []
      }
      trigger_catalog: {
        Row: {
          created_at: string
          default_config: Json
          description: string | null
          display_name: string
          evaluation_mode: string
          id: string
          is_enabled: boolean
          source_event_types: string[]
          trigger_key: string
        }
        Insert: {
          created_at?: string
          default_config?: Json
          description?: string | null
          display_name: string
          evaluation_mode: string
          id?: string
          is_enabled?: boolean
          source_event_types?: string[]
          trigger_key: string
        }
        Update: {
          created_at?: string
          default_config?: Json
          description?: string | null
          display_name?: string
          evaluation_mode?: string
          id?: string
          is_enabled?: boolean
          source_event_types?: string[]
          trigger_key?: string
        }
        Relationships: []
      }
      trigger_evaluation_logs: {
        Row: {
          customer_profile_id: string
          evaluated_at: string
          evaluation_details: Json
          evaluation_result: string
          id: string
          journey_id: string | null
          suppression_reason: string | null
          trigger_key: string
        }
        Insert: {
          customer_profile_id: string
          evaluated_at?: string
          evaluation_details?: Json
          evaluation_result: string
          id?: string
          journey_id?: string | null
          suppression_reason?: string | null
          trigger_key: string
        }
        Update: {
          customer_profile_id?: string
          evaluated_at?: string
          evaluation_details?: Json
          evaluation_result?: string
          id?: string
          journey_id?: string | null
          suppression_reason?: string | null
          trigger_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "trigger_evaluation_logs_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trusted_devices: {
        Row: {
          browser: string | null
          created_at: string | null
          device_name: string
          id: string
          ip_address: string | null
          is_current: boolean | null
          last_used_at: string | null
          location: string | null
          os: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string | null
          device_name: string
          id?: string
          ip_address?: string | null
          is_current?: boolean | null
          last_used_at?: string | null
          location?: string | null
          os?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string | null
          device_name?: string
          id?: string
          ip_address?: string | null
          is_current?: boolean | null
          last_used_at?: string | null
          location?: string | null
          os?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tuge_product_cache: {
        Row: {
          card_type: string | null
          countries: Json | null
          created_at: string
          data_limited: boolean | null
          data_total: number | null
          data_unit: string | null
          has_topup: boolean | null
          high_speed: string | null
          id: string
          last_synced_at: string
          limit_speed: string | null
          net_price: number
          product_code: string
          product_name: string
          product_type: string | null
          raw_data: Json | null
          topup_count: number | null
          usage_period: number | null
          validity_period: number | null
        }
        Insert: {
          card_type?: string | null
          countries?: Json | null
          created_at?: string
          data_limited?: boolean | null
          data_total?: number | null
          data_unit?: string | null
          has_topup?: boolean | null
          high_speed?: string | null
          id?: string
          last_synced_at?: string
          limit_speed?: string | null
          net_price?: number
          product_code: string
          product_name: string
          product_type?: string | null
          raw_data?: Json | null
          topup_count?: number | null
          usage_period?: number | null
          validity_period?: number | null
        }
        Update: {
          card_type?: string | null
          countries?: Json | null
          created_at?: string
          data_limited?: boolean | null
          data_total?: number | null
          data_unit?: string | null
          has_topup?: boolean | null
          high_speed?: string | null
          id?: string
          last_synced_at?: string
          limit_speed?: string | null
          net_price?: number
          product_code?: string
          product_name?: string
          product_type?: string | null
          raw_data?: Json | null
          topup_count?: number | null
          usage_period?: number | null
          validity_period?: number | null
        }
        Relationships: []
      }
      user_loyalty: {
        Row: {
          balance_expires_at: string | null
          created_at: string | null
          id: string
          mobile11_money_balance: number | null
          referral_code: string | null
          tier: string | null
          total_spent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance_expires_at?: string | null
          created_at?: string | null
          id?: string
          mobile11_money_balance?: number | null
          referral_code?: string | null
          tier?: string | null
          total_spent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance_expires_at?: string | null
          created_at?: string | null
          id?: string
          mobile11_money_balance?: number | null
          referral_code?: string | null
          tier?: string | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_loyalty_tier_fkey"
            columns: ["tier"]
            isOneToOne: false
            referencedRelation: "loyalty_tier_config"
            referencedColumns: ["tier_name"]
          },
        ]
      }
      user_referrals: {
        Row: {
          completed_at: string | null
          created_at: string | null
          device_fingerprint: string | null
          fraud_flags: Json | null
          id: string
          ip_address: string | null
          order_amount: number | null
          order_id: string | null
          referral_code: string
          referred_id: string
          referrer_id: string
          reward_amount: number | null
          reward_credited_at: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          fraud_flags?: Json | null
          id?: string
          ip_address?: string | null
          order_amount?: number | null
          order_id?: string | null
          referral_code: string
          referred_id: string
          referrer_id: string
          reward_amount?: number | null
          reward_credited_at?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          fraud_flags?: Json | null
          id?: string
          ip_address?: string | null
          order_amount?: number | null
          order_id?: string | null
          referral_code?: string
          referred_id?: string
          referrer_id?: string
          reward_amount?: number | null
          reward_credited_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_referrals_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      vat_receipt_requests: {
        Row: {
          address: string
          company_tax_id: string | null
          created_at: string | null
          email: string
          first_name: string
          id: string
          id_number: string | null
          last_name: string
          order_id: string
          phone: string
          receipt_type: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          address: string
          company_tax_id?: string | null
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          id_number?: string | null
          last_name: string
          order_id: string
          phone: string
          receipt_type: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string
          company_tax_id?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          id_number?: string | null
          last_name?: string
          order_id?: string
          phone?: string
          receipt_type?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vat_receipt_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_sessions: {
        Row: {
          converted_at: string | null
          device_type: string | null
          ended_at: string | null
          exit_page: string | null
          id: string
          landing_page: string | null
          outcome: string | null
          referrer: string | null
          session_id: string
          started_at: string
          total_duration_seconds: number | null
          total_pages_viewed: number | null
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          converted_at?: string | null
          device_type?: string | null
          ended_at?: string | null
          exit_page?: string | null
          id?: string
          landing_page?: string | null
          outcome?: string | null
          referrer?: string | null
          session_id: string
          started_at?: string
          total_duration_seconds?: number | null
          total_pages_viewed?: number | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          converted_at?: string | null
          device_type?: string | null
          ended_at?: string | null
          exit_page?: string | null
          id?: string
          landing_page?: string | null
          outcome?: string | null
          referrer?: string | null
          session_id?: string
          started_at?: string
          total_duration_seconds?: number | null
          total_pages_viewed?: number | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      voice_bot_config: {
        Row: {
          created_at: string
          did_number: string | null
          escalation_message: string
          forward_number: string | null
          gemini_voice: string
          greeting_language: string
          greeting_message: string
          id: string
          is_enabled: boolean
          max_call_duration_seconds: number
          mode: string
          sip_trunk_host: string | null
          updated_at: string
          voice_name: string
          webhook_url: string | null
        }
        Insert: {
          created_at?: string
          did_number?: string | null
          escalation_message?: string
          forward_number?: string | null
          gemini_voice?: string
          greeting_language?: string
          greeting_message?: string
          id?: string
          is_enabled?: boolean
          max_call_duration_seconds?: number
          mode?: string
          sip_trunk_host?: string | null
          updated_at?: string
          voice_name?: string
          webhook_url?: string | null
        }
        Update: {
          created_at?: string
          did_number?: string | null
          escalation_message?: string
          forward_number?: string | null
          gemini_voice?: string
          greeting_language?: string
          greeting_message?: string
          id?: string
          is_enabled?: boolean
          max_call_duration_seconds?: number
          mode?: string
          sip_trunk_host?: string | null
          updated_at?: string
          voice_name?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      voice_bot_instruction_cache: {
        Row: {
          article_count: number
          cached_at: string
          cached_instruction: string
          expires_at: string
          id: string
          language: string
        }
        Insert: {
          article_count?: number
          cached_at?: string
          cached_instruction: string
          expires_at?: string
          id?: string
          language: string
        }
        Update: {
          article_count?: number
          cached_at?: string
          cached_instruction?: string
          expires_at?: string
          id?: string
          language?: string
        }
        Relationships: []
      }
      voice_bridge_logs: {
        Row: {
          call_sid: string | null
          caller_number: string | null
          cid: string | null
          created_at: string
          did_number: string | null
          elapsed_ms: number | null
          id: string
          level: string
          message: string | null
          metadata: Json
          stage: string | null
        }
        Insert: {
          call_sid?: string | null
          caller_number?: string | null
          cid?: string | null
          created_at?: string
          did_number?: string | null
          elapsed_ms?: number | null
          id?: string
          level?: string
          message?: string | null
          metadata?: Json
          stage?: string | null
        }
        Update: {
          call_sid?: string | null
          caller_number?: string | null
          cid?: string | null
          created_at?: string
          did_number?: string | null
          elapsed_ms?: number | null
          id?: string
          level?: string
          message?: string | null
          metadata?: Json
          stage?: string | null
        }
        Relationships: []
      }
      voice_call_logs: {
        Row: {
          ai_responses: Json | null
          call_end_reason: string | null
          call_id: string
          caller_number: string | null
          contact_id: string | null
          conversation_id: string | null
          created_at: string
          did_number: string | null
          duration_seconds: number | null
          ended_at: string | null
          escalated_to: string | null
          escalation_reason: string | null
          id: string
          metadata: Json | null
          rating: number | null
          rating_skipped: boolean
          rating_source: string | null
          rating_text: string | null
          started_at: string
          status: string
          transcript: string | null
        }
        Insert: {
          ai_responses?: Json | null
          call_end_reason?: string | null
          call_id: string
          caller_number?: string | null
          contact_id?: string | null
          conversation_id?: string | null
          created_at?: string
          did_number?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          escalated_to?: string | null
          escalation_reason?: string | null
          id?: string
          metadata?: Json | null
          rating?: number | null
          rating_skipped?: boolean
          rating_source?: string | null
          rating_text?: string | null
          started_at?: string
          status?: string
          transcript?: string | null
        }
        Update: {
          ai_responses?: Json | null
          call_end_reason?: string | null
          call_id?: string
          caller_number?: string | null
          contact_id?: string | null
          conversation_id?: string | null
          created_at?: string
          did_number?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          escalated_to?: string | null
          escalation_reason?: string | null
          id?: string
          metadata?: Json | null
          rating?: number | null
          rating_skipped?: boolean
          rating_source?: string | null
          rating_text?: string | null
          started_at?: string
          status?: string
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_call_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_diagnostic_events: {
        Row: {
          channel: string
          client_event_id: string
          conversation_id: string | null
          conversation_turn_count: number
          created_at: string
          extra: Json
          id: string
          live_session_id: string
          name_adoption_state: string
          refresh_trigger: string
          refreshed_this_turn: boolean
          server_prompt_had_history: boolean
          ts_client: number
          turn_id: number
          vad_commit_to_first_audio_ms: number | null
        }
        Insert: {
          channel: string
          client_event_id: string
          conversation_id?: string | null
          conversation_turn_count: number
          created_at?: string
          extra?: Json
          id?: string
          live_session_id: string
          name_adoption_state?: string
          refresh_trigger?: string
          refreshed_this_turn?: boolean
          server_prompt_had_history?: boolean
          ts_client: number
          turn_id: number
          vad_commit_to_first_audio_ms?: number | null
        }
        Update: {
          channel?: string
          client_event_id?: string
          conversation_id?: string | null
          conversation_turn_count?: number
          created_at?: string
          extra?: Json
          id?: string
          live_session_id?: string
          name_adoption_state?: string
          refresh_trigger?: string
          refreshed_this_turn?: boolean
          server_prompt_had_history?: boolean
          ts_client?: number
          turn_id?: number
          vad_commit_to_first_audio_ms?: number | null
        }
        Relationships: []
      }
      voice_live_sessions: {
        Row: {
          call_id: string
          conversation_history: Json | null
          conversation_id: string | null
          created_at: string | null
          id: string
          last_activity_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          call_id: string
          conversation_history?: Json | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          last_activity_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          call_id?: string
          conversation_history?: Json | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          last_activity_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      voice_sessions_log: {
        Row: {
          conversation_id: string | null
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          estimated_cost: number | null
          id: string
          ip_address: string | null
          metadata: Json | null
          session_id: string
          started_at: string
          status: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          estimated_cost?: number | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          session_id: string
          started_at?: string
          status?: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          estimated_cost?: number | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          session_id?: string
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      voice_settings: {
        Row: {
          config_hash: string
          gemini_voice: string
          id: number
          updated_at: string
          updated_by: string | null
          voice_memory_enabled: boolean
          voice_rating_enabled: boolean
          voice_rating_window_ms: number
          voice_silence_probe_guard_enabled: boolean
          voice_silence_probe_guard_ms: number
          voice_sms_enabled: boolean
        }
        Insert: {
          config_hash?: string
          gemini_voice: string
          id?: number
          updated_at?: string
          updated_by?: string | null
          voice_memory_enabled: boolean
          voice_rating_enabled: boolean
          voice_rating_window_ms: number
          voice_silence_probe_guard_enabled: boolean
          voice_silence_probe_guard_ms: number
          voice_sms_enabled: boolean
        }
        Update: {
          config_hash?: string
          gemini_voice?: string
          id?: number
          updated_at?: string
          updated_by?: string | null
          voice_memory_enabled?: boolean
          voice_rating_enabled?: boolean
          voice_rating_window_ms?: number
          voice_silence_probe_guard_enabled?: boolean
          voice_silence_probe_guard_ms?: number
          voice_sms_enabled?: boolean
        }
        Relationships: []
      }
      voice_settings_history: {
        Row: {
          change_type: string
          changed_at: string
          changed_by: string | null
          config_hash: string
          id: string
          new_snapshot: Json
          reason: string | null
          snapshot: Json | null
        }
        Insert: {
          change_type: string
          changed_at?: string
          changed_by?: string | null
          config_hash: string
          id?: string
          new_snapshot: Json
          reason?: string | null
          snapshot?: Json | null
        }
        Update: {
          change_type?: string
          changed_at?: string
          changed_by?: string | null
          config_hash?: string
          id?: string
          new_snapshot?: Json
          reason?: string | null
          snapshot?: Json | null
        }
        Relationships: []
      }
      voucher_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          currency: string
          expires_at: string | null
          id: string
          is_used: boolean | null
          package_id: string | null
          used_at: string | null
          used_by: string | null
          value_amount: number
          voucher_type: string
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          currency?: string
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          package_id?: string | null
          used_at?: string | null
          used_by?: string | null
          value_amount: number
          voucher_type?: string
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          package_id?: string | null
          used_at?: string | null
          used_by?: string | null
          value_amount?: number
          voucher_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_codes_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "esim_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_codes_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "esim_packages_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      channel_connections_safe: {
        Row: {
          channel_type: string | null
          connected_at: string | null
          connected_by: string | null
          created_at: string | null
          external_id: string | null
          id: string | null
          last_verified_at: string | null
          name: string | null
          profile_picture_url: string | null
          settings: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          channel_type?: string | null
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string | null
          external_id?: string | null
          id?: string | null
          last_verified_at?: string | null
          name?: string | null
          profile_picture_url?: string | null
          settings?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          channel_type?: string | null
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string | null
          external_id?: string | null
          id?: string | null
          last_verified_at?: string | null
          name?: string | null
          profile_picture_url?: string | null
          settings?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      esim_packages_public: {
        Row: {
          access_type: string | null
          activation_note: string | null
          apn: string | null
          carrier: string | null
          category: string | null
          complaint_count: number | null
          country_code: string | null
          country_name: string | null
          created_at: string | null
          currency: string | null
          daily_data_reset: boolean | null
          daily_reset_amount: string | null
          data_amount: string | null
          description: string | null
          featured_order: number | null
          hot_spot: boolean | null
          id: string | null
          included_countries: Json | null
          initialize_policy: string | null
          is_active: boolean | null
          is_cancelable: boolean | null
          is_featured: boolean | null
          is_local_sim: boolean | null
          is_popular: boolean | null
          kyc: boolean | null
          name: string | null
          network_type: string | null
          normal_price: number | null
          package_id: string | null
          package_type: string | null
          pre_installation: boolean | null
          price: number | null
          provider_id: string | null
          provider_package_type: string | null
          purchase_count: number | null
          qos_speed: string | null
          quality_score: number | null
          service_type: string | null
          short_name: string | null
          sim_type: string | null
          speed_after_limit: string | null
          success_rate: number | null
          support_data: boolean | null
          support_sms: boolean | null
          support_voice: boolean | null
          supports_extension: boolean | null
          top_up: boolean | null
          total_orders: number | null
          updated_at: string | null
          validity_days: number | null
          validity_period: string | null
        }
        Insert: {
          access_type?: string | null
          activation_note?: string | null
          apn?: string | null
          carrier?: string | null
          category?: string | null
          complaint_count?: number | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string | null
          currency?: string | null
          daily_data_reset?: boolean | null
          daily_reset_amount?: string | null
          data_amount?: string | null
          description?: string | null
          featured_order?: number | null
          hot_spot?: boolean | null
          id?: string | null
          included_countries?: Json | null
          initialize_policy?: string | null
          is_active?: boolean | null
          is_cancelable?: boolean | null
          is_featured?: boolean | null
          is_local_sim?: boolean | null
          is_popular?: boolean | null
          kyc?: boolean | null
          name?: string | null
          network_type?: string | null
          normal_price?: number | null
          package_id?: string | null
          package_type?: string | null
          pre_installation?: boolean | null
          price?: number | null
          provider_id?: string | null
          provider_package_type?: string | null
          purchase_count?: number | null
          qos_speed?: string | null
          quality_score?: number | null
          service_type?: string | null
          short_name?: string | null
          sim_type?: string | null
          speed_after_limit?: string | null
          success_rate?: number | null
          support_data?: boolean | null
          support_sms?: boolean | null
          support_voice?: boolean | null
          supports_extension?: boolean | null
          top_up?: boolean | null
          total_orders?: number | null
          updated_at?: string | null
          validity_days?: number | null
          validity_period?: string | null
        }
        Update: {
          access_type?: string | null
          activation_note?: string | null
          apn?: string | null
          carrier?: string | null
          category?: string | null
          complaint_count?: number | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string | null
          currency?: string | null
          daily_data_reset?: boolean | null
          daily_reset_amount?: string | null
          data_amount?: string | null
          description?: string | null
          featured_order?: number | null
          hot_spot?: boolean | null
          id?: string | null
          included_countries?: Json | null
          initialize_policy?: string | null
          is_active?: boolean | null
          is_cancelable?: boolean | null
          is_featured?: boolean | null
          is_local_sim?: boolean | null
          is_popular?: boolean | null
          kyc?: boolean | null
          name?: string | null
          network_type?: string | null
          normal_price?: number | null
          package_id?: string | null
          package_type?: string | null
          pre_installation?: boolean | null
          price?: number | null
          provider_id?: string | null
          provider_package_type?: string | null
          purchase_count?: number | null
          qos_speed?: string | null
          quality_score?: number | null
          service_type?: string | null
          short_name?: string | null
          sim_type?: string | null
          speed_after_limit?: string | null
          success_rate?: number | null
          support_data?: boolean | null
          support_sms?: boolean | null
          support_voice?: boolean | null
          supports_extension?: boolean | null
          top_up?: boolean | null
          total_orders?: number | null
          updated_at?: string | null
          validity_days?: number | null
          validity_period?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "esim_packages_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "esim_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      support_availability: {
        Row: {
          agents_available: boolean | null
          agents_online: number | null
          total_active_chats: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_affiliate_conversion: {
        Args: { admin_user_id: string; conversion_id: string }
        Returns: undefined
      }
      calculate_affiliate_tier: {
        Args: { p_affiliate_id: string }
        Returns: undefined
      }
      calculate_cost_per_gb: {
        Args: {
          p_cost_price: number
          p_data_amount: string
          p_package_type: string
          p_validity_days: number
        }
        Returns: number
      }
      compute_voice_settings_hash: {
        Args: { s: Database["public"]["Tables"]["voice_settings"]["Row"] }
        Returns: string
      }
      generate_affiliate_code: { Args: never; Returns: string }
      generate_link_code: { Args: never; Returns: string }
      generate_order_short_code: { Args: never; Returns: string }
      generate_org_slug: { Args: { org_name: string }; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      generate_unique_kb_slug: {
        Args: {
          p_article_id: string
          p_category: string
          p_language: string
          p_title: string
        }
        Returns: string
      }
      get_ab_test_metrics: {
        Args: { p_days_back?: number; p_test_id: string }
        Returns: {
          avg_conversion_value: number
          click_rate: number
          clicks: number
          conversion_rate: number
          conversions: number
          impressions: number
          is_control: boolean
          revenue: number
          variant_id: string
          variant_name: string
        }[]
      }
      get_affiliate_commission_rate: {
        Args: { p_affiliate_id: string }
        Returns: number
      }
      get_affiliate_id: { Args: { _user_id: string }; Returns: string }
      get_affiliate_override_rate: {
        Args: { p_affiliate_id: string }
        Returns: number
      }
      get_destination_stats: {
        Args: { days_back?: number; origin_country?: string }
        Returns: {
          click_count: number
          destination: string
          unique_users: number
        }[]
      }
      get_esim_install_data: { Args: { p_short_code: string }; Returns: Json }
      get_package_search_index: {
        Args: never
        Returns: {
          category: string
          country_code: string
          country_name: string
          included_countries: Json
          package_count: number
        }[]
      }
      get_user_org_ids: { Args: never; Returns: string[] }
      get_variant_assignment: {
        Args: { p_session_id?: string; p_user_id?: string }
        Returns: {
          config: Json
          test_id: string
          variant_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_affiliate_link_clicks: {
        Args: { link_id: string }
        Returns: undefined
      }
      increment_affiliate_link_conversions: {
        Args: { link_id: string }
        Returns: undefined
      }
      increment_promo_code_usage: {
        Args: { promo_id: string }
        Returns: undefined
      }
      is_affiliate: { Args: { _user_id: string }; Returns: boolean }
      is_agent_or_higher: { Args: { _user_id: string }; Returns: boolean }
      is_org_admin: { Args: { org_id: string }; Returns: boolean }
      is_org_manager: { Args: { org_id: string }; Returns: boolean }
      is_org_member: { Args: { org_id: string }; Returns: boolean }
      is_partner_manager: { Args: { _user_id: string }; Returns: boolean }
      is_sub_affiliate: {
        Args: { _affiliate_id: string; _user_id: string }
        Returns: boolean
      }
      is_supervisor_or_higher: { Args: { _user_id: string }; Returns: boolean }
      log_admin_activity: {
        Args: {
          p_action_type: string
          p_admin_user_id: string
          p_description?: string
          p_entity_id?: string
          p_entity_type: string
          p_metadata?: Json
          p_new_value?: Json
          p_old_value?: Json
        }
        Returns: string
      }
      process_affiliate_payout: {
        Args: {
          p_admin_user_id: string
          p_payout_id: string
          p_reference_number?: string
        }
        Returns: undefined
      }
      update_affiliate_clicks: {
        Args: { p_affiliate_id: string }
        Returns: undefined
      }
      update_affiliate_stats: {
        Args: {
          p_add_conversions?: number
          p_add_earnings?: number
          p_add_pending_earnings?: number
          p_affiliate_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      ai_failure_severity: "low" | "medium" | "high" | "critical"
      ai_failure_type:
        | "wrong_answer"
        | "hallucination"
        | "language_mismatch"
        | "tone_inappropriate"
        | "missing_knowledge"
        | "policy_violation"
        | "loop_detected"
        | "failed_handoff"
        | "timeout"
        | "unknown"
        | "incomplete_answer"
        | "unclear_answer"
        | "wrong_language"
        | "weak_empathy"
        | "policy_risk"
        | "dead_air_trigger"
        | "unresolved_issue"
        | "repeated_contact_risk"
        | "missing_backend_action"
        | "missing_kb"
        | "wrong_intent_classification"
      app_role:
        | "admin"
        | "customer"
        | "partner_manager"
        | "affiliate"
        | "agent"
        | "supervisor"
        | "super_admin"
        | "commerce_admin"
        | "support_admin"
        | "finance_admin"
        | "territory_manager"
        | "reseller_admin"
        | "distributor_admin"
        | "api_partner_admin"
        | "read_only_analyst"
      experiment_status:
        | "draft"
        | "running"
        | "paused"
        | "completed"
        | "rolled_back"
      guardrail_change_domain:
        | "kb_proposal"
        | "prompt_rollout"
        | "backend_action"
        | "faq_publish"
        | "refund_credit"
        | "policy_response"
        | "language_change"
        | "experiment"
      guardrail_risk_level: "low" | "medium" | "high" | "critical"
      kb_issue_type:
        | "missing_article"
        | "outdated_content"
        | "incomplete_answer"
        | "conflicting_info"
        | "low_clarity"
        | "wrong_language"
        | "bad_structure"
        | "missing_facts"
      org_role: "owner" | "admin" | "manager" | "member"
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
      ai_failure_severity: ["low", "medium", "high", "critical"],
      ai_failure_type: [
        "wrong_answer",
        "hallucination",
        "language_mismatch",
        "tone_inappropriate",
        "missing_knowledge",
        "policy_violation",
        "loop_detected",
        "failed_handoff",
        "timeout",
        "unknown",
        "incomplete_answer",
        "unclear_answer",
        "wrong_language",
        "weak_empathy",
        "policy_risk",
        "dead_air_trigger",
        "unresolved_issue",
        "repeated_contact_risk",
        "missing_backend_action",
        "missing_kb",
        "wrong_intent_classification",
      ],
      app_role: [
        "admin",
        "customer",
        "partner_manager",
        "affiliate",
        "agent",
        "supervisor",
        "super_admin",
        "commerce_admin",
        "support_admin",
        "finance_admin",
        "territory_manager",
        "reseller_admin",
        "distributor_admin",
        "api_partner_admin",
        "read_only_analyst",
      ],
      experiment_status: [
        "draft",
        "running",
        "paused",
        "completed",
        "rolled_back",
      ],
      guardrail_change_domain: [
        "kb_proposal",
        "prompt_rollout",
        "backend_action",
        "faq_publish",
        "refund_credit",
        "policy_response",
        "language_change",
        "experiment",
      ],
      guardrail_risk_level: ["low", "medium", "high", "critical"],
      kb_issue_type: [
        "missing_article",
        "outdated_content",
        "incomplete_answer",
        "conflicting_info",
        "low_clarity",
        "wrong_language",
        "bad_structure",
        "missing_facts",
      ],
      org_role: ["owner", "admin", "manager", "member"],
    },
  },
} as const
