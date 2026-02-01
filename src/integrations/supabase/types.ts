// src/integrations/supabase/types.ts
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      delegates: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          branch: string | null;
          city: string | null;
          avatar_url: string | null;
          store_id: string | null;
          total_delivered: number;
          total_delayed: number;
          total_returned: number;
          balance: number;
          commission_due: number;
          courier_limit: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          branch?: string | null;
          city?: string | null;
          avatar_url?: string | null;
          store_id?: string | null;
          total_delivered?: number;
          total_delayed?: number;
          total_returned?: number;
          balance?: number;
          commission_due?: number;
          courier_limit?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string | null;
          branch?: string | null;
          city?: string | null;
          avatar_url?: string | null;
          store_id?: string | null;
          total_delivered?: number;
          total_delayed?: number;
          total_returned?: number;
          balance?: number;
          commission_due?: number;
          courier_limit?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      shippers: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          city: string | null;
          branch: string | null;
          logo_url: string | null;
          store_id: string | null;
          total_shipments: number;
          active_shipments: number;
          balance: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          city?: string | null;
          branch?: string | null;
          logo_url?: string | null;
          store_id?: string | null;
          total_shipments?: number;
          active_shipments?: number;
          balance?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          city?: string | null;
          branch?: string | null;
          logo_url?: string | null;
          store_id?: string | null;
          total_shipments?: number;
          active_shipments?: number;
          balance?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      sheets: {
        Row: {
          id: string;
          name: string;
          sheet_type: string;
          delegate_id: string | null;
          store_id: string | null;
          status: string;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          sheet_type: string;
          delegate_id?: string | null;
          store_id?: string | null;
          status?: string;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          sheet_type?: string;
          delegate_id?: string | null;
          store_id?: string | null;
          status?: string;
          created_at?: string;
          completed_at?: string | null;
        };
      };
      shipments: {
        Row: {
          id: string;
          tracking_number: string;
          shipper_id: string | null;
          delegate_id: string | null;
          sheet_id: string | null;
          store_id: string | null;
          area_id: string | null;
          recipient_name: string;
          recipient_phone: string;
          recipient_address: string;
          recipient_city: string;
          recipient_area: string | null;
          product_name: string | null;
          cod_amount: number;
          shipping_fee: number;
          weight: number | null;
          notes: string | null;
          status: string;
          return_reason: string | null;
          pickup_requested: boolean;
          pickup_address: string | null;
          pickup_time: string | null;
          delivered_at: string | null;
          returned_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tracking_number: string;
          shipper_id?: string | null;
          delegate_id?: string | null;
          sheet_id?: string | null;
          store_id?: string | null;
          area_id?: string | null;
          recipient_name: string;
          recipient_phone: string;
          recipient_address: string;
          recipient_city: string;
          recipient_area?: string | null;
          product_name?: string | null;
          cod_amount?: number;
          shipping_fee?: number;
          weight?: number | null;
          notes?: string | null;
          status?: string;
          return_reason?: string | null;
          pickup_requested?: boolean;
          pickup_address?: string | null;
          pickup_time?: string | null;
          delivered_at?: string | null;
          returned_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tracking_number?: string;
          shipper_id?: string | null;
          delegate_id?: string | null;
          sheet_id?: string | null;
          store_id?: string | null;
          area_id?: string | null;
          recipient_name?: string;
          recipient_phone?: string;
          recipient_address?: string;
          recipient_city?: string;
          recipient_area?: string | null;
          product_name?: string | null;
          cod_amount?: number;
          shipping_fee?: number;
          weight?: number | null;
          notes?: string | null;
          status?: string;
          return_reason?: string | null;
          pickup_requested?: boolean;
          pickup_address?: string | null;
          pickup_time?: string | null;
          delivered_at?: string | null;
          returned_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      stores: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          city: string;
          phone: string | null;
          manager_id: string | null;
          is_casual: boolean;
          central_branch: boolean;
          operating_days: Json | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          city: string;
          phone?: string | null;
          manager_id?: string | null;
          is_casual?: boolean;
          central_branch?: boolean;
          operating_days?: Json | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
          city?: string;
          phone?: string | null;
          manager_id?: string | null;
          is_casual?: boolean;
          central_branch?: boolean;
          operating_days?: Json | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      areas: {
        Row: {
          id: string;
          name: string;
          governorate: string;
          city: string;
          coverage_percentage: number;
          courier_count: number;
          status: string;
          key_words: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          governorate: string;
          city: string;
          coverage_percentage?: number;
          courier_count?: number;
          status?: string;
          key_words?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          governorate?: string;
          city?: string;
          coverage_percentage?: number;
          courier_count?: number;
          status?: string;
          key_words?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          phone: string | null;
          city: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          phone?: string | null;
          city?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          phone?: string | null;
          city?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
        };
      };
      balance_transactions: {
        Row: {
          id: string;
          shipper_id: string | null;
          delegate_id: string | null;
          store_id: string | null;
          amount: number;
          transaction_type: string;
          payment_method: string | null;
          reference_number: string | null;
          notes: string | null;
          transaction_date: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shipper_id?: string | null;
          delegate_id?: string | null;
          store_id?: string | null;
          amount: number;
          transaction_type: string;
          payment_method?: string | null;
          reference_number?: string | null;
          notes?: string | null;
          transaction_date?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shipper_id?: string | null;
          delegate_id?: string | null;
          store_id?: string | null;
          amount?: number;
          transaction_type?: string;
          payment_method?: string | null;
          reference_number?: string | null;
          notes?: string | null;
          transaction_date?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      complaints: {
        Row: {
          id: string;
          shipment_id: string | null;
          complainant_id: string | null;
          assigned_to: string | null;
          complaint_type: string;
          description: string;
          status: string;
          compensation_amount: number;
          created_at: string;
          resolved_at: string | null;
          resolved_by: string | null;
        };
        Insert: {
          id?: string;
          shipment_id?: string | null;
          complainant_id?: string | null;
          assigned_to?: string | null;
          complaint_type: string;
          description: string;
          status?: string;
          compensation_amount?: number;
          created_at?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
        Update: {
          id?: string;
          shipment_id?: string | null;
          complainant_id?: string | null;
          assigned_to?: string | null;
          complaint_type?: string;
          description?: string;
          status?: string;
          compensation_amount?: number;
          created_at?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          assigned_to: string | null;
          due_date: string;
          priority: string;
          status: string;
          created_by: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          assigned_to?: string | null;
          due_date: string;
          priority?: string;
          status?: string;
          created_by?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          assigned_to?: string | null;
          due_date?: string;
          priority?: string;
          status?: string;
          created_by?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
      };
      whatsapp_campaigns: {
        Row: {
          id: string;
          name: string;
          campaign_type: string;
          message_template: string;
          recipient_list: string[] | null;
          status: string;
          scheduled_at: string | null;
          completed_at: string | null;
          success_count: number;
          failure_count: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          campaign_type: string;
          message_template: string;
          recipient_list?: string[] | null;
          status?: string;
          scheduled_at?: string | null;
          completed_at?: string | null;
          success_count?: number;
          failure_count?: number;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          campaign_type?: string;
          message_template?: string;
          recipient_list?: string[] | null;
          status?: string;
          scheduled_at?: string | null;
          completed_at?: string | null;
          success_count?: number;
          failure_count?: number;
          created_by?: string | null;
          created_at?: string;
        };
      };
      whatsapp_templates: {
        Row: {
          id: string;
          name: string;
          category: string;
          content: string;
          variables: string[] | null;
          usage_count: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          content: string;
          variables?: string[] | null;
          usage_count?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          content?: string;
          variables?: string[] | null;
          usage_count?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      whatsapp_bots: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          trigger_keywords: string[] | null;
          response_message: string;
          status: string;
          conversation_count: number;
          last_active: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          trigger_keywords?: string[] | null;
          response_message: string;
          status?: string;
          conversation_count?: number;
          last_active?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          trigger_keywords?: string[] | null;
          response_message?: string;
          status?: string;
          conversation_count?: number;
          last_active?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      inventory_logs: {
        Row: {
          id: string;
          store_id: string | null;
          performed_by: string | null;
          item_count: number;
          discrepancy_count: number;
          status: string;
          notes: string | null;
          performed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id?: string | null;
          performed_by?: string | null;
          item_count: number;
          discrepancy_count?: number;
          status?: string;
          notes?: string | null;
          performed_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string | null;
          performed_by?: string | null;
          item_count?: number;
          discrepancy_count?: number;
          status?: string;
          notes?: string | null;
          performed_at?: string;
          created_at?: string;
        };
      };
      branch_timings: {
        Row: {
          id: string;
          store_id: string;
          day_of_week: number;
          open_time: string;
          close_time: string;
          is_closed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          day_of_week: number;
          open_time: string;
          close_time: string;
          is_closed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          day_of_week?: number;
          open_time?: string;
          close_time?: string;
          is_closed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      app_role: "head_manager" | "manager" | "courier" | "shipper" | "user" | "guest";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// ✅ Helper Types مبسطة ومضمونة (بدون أخطاء)
export type Tables<
  TableName extends keyof Database["public"]["Tables"]
> = Database["public"]["Tables"][TableName]["Row"];

export type TablesInsert<
  TableName extends keyof Database["public"]["Tables"]
> = Database["public"]["Tables"][TableName]["Insert"];

export type TablesUpdate<
  TableName extends keyof Database["public"]["Tables"]
> = Database["public"]["Tables"][TableName]["Update"];

export type Enums<EnumName extends keyof Database["public"]["Enums"]> = 
  Database["public"]["Enums"][EnumName][keyof Database["public"]["Enums"][EnumName]];