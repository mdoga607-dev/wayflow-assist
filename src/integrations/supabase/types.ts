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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      areas: {
        Row: {
          created_at: string | null
          delivery_days: number | null
          governorate_id: string | null
          id: string
          name: string
          shipping_fee: number | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_days?: number | null
          governorate_id?: string | null
          id?: string
          name: string
          shipping_fee?: number | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_days?: number | null
          governorate_id?: string | null
          id?: string
          name?: string
          shipping_fee?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "areas_governorate_id_fkey"
            columns: ["governorate_id"]
            isOneToOne: false
            referencedRelation: "governorates"
            referencedColumns: ["id"]
          },
        ]
      }
      balance_transactions: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          delegate_id: string | null
          id: string
          notes: string | null
          payment_method: string | null
          receipt_url: string | null
          reference_number: string | null
          shipper_id: string | null
          status: string | null
          store_id: string | null
          transaction_date: string
          transaction_type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          delegate_id?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          reference_number?: string | null
          shipper_id?: string | null
          status?: string | null
          store_id?: string | null
          transaction_date?: string
          transaction_type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          delegate_id?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          reference_number?: string | null
          shipper_id?: string | null
          status?: string | null
          store_id?: string | null
          transaction_date?: string
          transaction_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "balance_transactions_delegate_id_fkey"
            columns: ["delegate_id"]
            isOneToOne: false
            referencedRelation: "delegates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balance_transactions_shipper_id_fkey"
            columns: ["shipper_id"]
            isOneToOne: false
            referencedRelation: "shippers"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          city: string | null
          closing_time: string | null
          created_at: string | null
          governorate: string
          id: string
          manager_id: string | null
          name: string
          opening_time: string | null
          phone: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          closing_time?: string | null
          created_at?: string | null
          governorate: string
          id?: string
          manager_id?: string | null
          name: string
          opening_time?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          closing_time?: string | null
          created_at?: string | null
          governorate?: string
          id?: string
          manager_id?: string | null
          name?: string
          opening_time?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      delegates: {
        Row: {
          avatar_url: string | null
          balance: number | null
          branch: string | null
          city: string | null
          commission_due: number | null
          created_at: string
          id: string
          name: string
          phone: string | null
          status: string | null
          total_delayed: number | null
          total_delivered: number | null
          total_returned: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          balance?: number | null
          branch?: string | null
          city?: string | null
          commission_due?: number | null
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          status?: string | null
          total_delayed?: number | null
          total_delivered?: number | null
          total_returned?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          balance?: number | null
          branch?: string | null
          city?: string | null
          commission_due?: number | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          status?: string | null
          total_delayed?: number | null
          total_delivered?: number | null
          total_returned?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      governorates: {
        Row: {
          code: string | null
          created_at: string | null
          delivery_days: number | null
          id: string
          name: string
          name_en: string | null
          shipping_fee: number | null
          status: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          delivery_days?: number | null
          id?: string
          name: string
          name_en?: string | null
          shipping_fee?: number | null
          status?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          delivery_days?: number | null
          id?: string
          name?: string
          name_en?: string | null
          shipping_fee?: number | null
          status?: string | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          branch_id: string | null
          counted_items: number | null
          created_at: string | null
          created_by: string | null
          delegate_id: string | null
          discrepancy: number | null
          id: string
          inventory_date: string
          name: string
          notes: string | null
          status: string | null
          store_id: string | null
          total_items: number | null
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          counted_items?: number | null
          created_at?: string | null
          created_by?: string | null
          delegate_id?: string | null
          discrepancy?: number | null
          id?: string
          inventory_date?: string
          name: string
          notes?: string | null
          status?: string | null
          store_id?: string | null
          total_items?: number | null
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          counted_items?: number | null
          created_at?: string | null
          created_by?: string | null
          delegate_id?: string | null
          discrepancy?: number | null
          id?: string
          inventory_date?: string
          name?: string
          notes?: string | null
          status?: string | null
          store_id?: string | null
          total_items?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_delegate_id_fkey"
            columns: ["delegate_id"]
            isOneToOne: false
            referencedRelation: "delegates"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_requests: {
        Row: {
          created_at: string | null
          delegate_id: string | null
          id: string
          items_count: number | null
          notes: string | null
          pickup_address: string
          pickup_time: string | null
          scheduled_date: string | null
          shipper_id: string | null
          status: string | null
          store_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          delegate_id?: string | null
          id?: string
          items_count?: number | null
          notes?: string | null
          pickup_address: string
          pickup_time?: string | null
          scheduled_date?: string | null
          shipper_id?: string | null
          status?: string | null
          store_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          delegate_id?: string | null
          id?: string
          items_count?: number | null
          notes?: string | null
          pickup_address?: string
          pickup_time?: string | null
          scheduled_date?: string | null
          shipper_id?: string | null
          status?: string | null
          store_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pickup_requests_delegate_id_fkey"
            columns: ["delegate_id"]
            isOneToOne: false
            referencedRelation: "delegates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickup_requests_shipper_id_fkey"
            columns: ["shipper_id"]
            isOneToOne: false
            referencedRelation: "shippers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sheets: {
        Row: {
          created_at: string | null
          created_by: string | null
          delegate_id: string | null
          id: string
          name: string
          notes: string | null
          sheet_type: string
          shipper_id: string | null
          status: string | null
          store_id: string | null
          total_cod: number | null
          total_shipments: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          delegate_id?: string | null
          id?: string
          name: string
          notes?: string | null
          sheet_type: string
          shipper_id?: string | null
          status?: string | null
          store_id?: string | null
          total_cod?: number | null
          total_shipments?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          delegate_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          sheet_type?: string
          shipper_id?: string | null
          status?: string | null
          store_id?: string | null
          total_cod?: number | null
          total_shipments?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sheets_delegate_id_fkey"
            columns: ["delegate_id"]
            isOneToOne: false
            referencedRelation: "delegates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sheets_shipper_id_fkey"
            columns: ["shipper_id"]
            isOneToOne: false
            referencedRelation: "shippers"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          cod_amount: number | null
          created_at: string
          current_lat: number | null
          current_lng: number | null
          delegate_id: string | null
          delivered_at: string | null
          destination_lat: number | null
          destination_lng: number | null
          id: string
          notes: string | null
          product_name: string | null
          recipient_address: string | null
          recipient_area: string | null
          recipient_city: string | null
          recipient_name: string
          recipient_phone: string
          return_reason: string | null
          returned_at: string | null
          sheet_id: string | null
          shipper_id: string | null
          shipping_fee: number | null
          status: string | null
          tracking_number: string
          updated_at: string
          weight: number | null
        }
        Insert: {
          cod_amount?: number | null
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          delegate_id?: string | null
          delivered_at?: string | null
          destination_lat?: number | null
          destination_lng?: number | null
          id?: string
          notes?: string | null
          product_name?: string | null
          recipient_address?: string | null
          recipient_area?: string | null
          recipient_city?: string | null
          recipient_name: string
          recipient_phone: string
          return_reason?: string | null
          returned_at?: string | null
          sheet_id?: string | null
          shipper_id?: string | null
          shipping_fee?: number | null
          status?: string | null
          tracking_number: string
          updated_at?: string
          weight?: number | null
        }
        Update: {
          cod_amount?: number | null
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          delegate_id?: string | null
          delivered_at?: string | null
          destination_lat?: number | null
          destination_lng?: number | null
          id?: string
          notes?: string | null
          product_name?: string | null
          recipient_address?: string | null
          recipient_area?: string | null
          recipient_city?: string | null
          recipient_name?: string
          recipient_phone?: string
          return_reason?: string | null
          returned_at?: string | null
          sheet_id?: string | null
          shipper_id?: string | null
          shipping_fee?: number | null
          status?: string | null
          tracking_number?: string
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_delegate_id_fkey"
            columns: ["delegate_id"]
            isOneToOne: false
            referencedRelation: "delegates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_shipper_id_fkey"
            columns: ["shipper_id"]
            isOneToOne: false
            referencedRelation: "shippers"
            referencedColumns: ["id"]
          },
        ]
      }
      shippers: {
        Row: {
          active_shipments: number | null
          address: string | null
          balance: number | null
          branch: string | null
          city: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          status: string | null
          total_shipments: number | null
          updated_at: string
        }
        Insert: {
          active_shipments?: number | null
          address?: string | null
          balance?: number | null
          branch?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          status?: string | null
          total_shipments?: number | null
          updated_at?: string
        }
        Update: {
          active_shipments?: number | null
          address?: string | null
          balance?: number | null
          branch?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          status?: string | null
          total_shipments?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          id: string
          manager_name: string | null
          name: string
          phone: string | null
          status: string | null
          updated_at: string | null
          working_hours: Json | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          manager_name?: string | null
          name: string
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          working_hours?: Json | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          manager_name?: string | null
          name?: string
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          working_hours?: Json | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          auto_assign: boolean | null
          company_address: string | null
          company_city: string | null
          company_email: string | null
          company_governorate: string | null
          company_name: string
          company_phone: string | null
          created_at: string | null
          currency: string | null
          id: string
          maintenance_mode: boolean | null
          notifications_enabled: boolean | null
          sms_enabled: boolean | null
          timezone: string | null
          updated_at: string | null
          whatsapp_enabled: boolean | null
        }
        Insert: {
          auto_assign?: boolean | null
          company_address?: string | null
          company_city?: string | null
          company_email?: string | null
          company_governorate?: string | null
          company_name?: string
          company_phone?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          maintenance_mode?: boolean | null
          notifications_enabled?: boolean | null
          sms_enabled?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          whatsapp_enabled?: boolean | null
        }
        Update: {
          auto_assign?: boolean | null
          company_address?: string | null
          company_city?: string | null
          company_email?: string | null
          company_governorate?: string | null
          company_name?: string
          company_phone?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          maintenance_mode?: boolean | null
          notifications_enabled?: boolean | null
          sms_enabled?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          whatsapp_enabled?: boolean | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          delegate_id: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          delegate_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          delegate_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_delegate_id_fkey"
            columns: ["delegate_id"]
            isOneToOne: false
            referencedRelation: "delegates"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_wallet_transaction: {
        Args: {
          p_amount: number
          p_notes: string
          p_payment_method: string
          p_reference_number: string
          p_transaction_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      create_pickup_sheet: {
        Args: {
          p_courier_id: string
          p_created_by: string
          p_sheet_date: string
        }
        Returns: string
      }
      delete_pickup_request: {
        Args: { p_request_id: string }
        Returns: undefined
      }
      delete_sheet: { Args: { p_sheet_id: string }; Returns: undefined }
      delete_unconfirmed_users: { Args: never; Returns: number }
      delete_wallet_transaction: {
        Args: { p_transaction_id: string }
        Returns: undefined
      }
      get_courier_overall_report: {
        Args: { p_courier_id: string; p_date_from?: string; p_date_to?: string }
        Returns: {
          completed_pickup_requests: number
          pending_pickup_requests: number
          total_pickup_requests: number
          total_sheets: number
          wallet_balance: number
        }[]
      }
      get_courier_pickup_requests: {
        Args: { p_courier_id: string; p_status?: string }
        Returns: {
          created_at: string
          merchant_id: string
          notes: string
          pickup_address: string
          pickup_date: string
          pickup_time: string
          request_id: string
          status: string
        }[]
      }
      get_courier_sheets: {
        Args: { p_courier_id: string }
        Returns: {
          completed_shipments: number
          created_at: string
          notes: string
          pending_shipments: number
          sheet_date: string
          sheet_id: string
          total_shipments: number
        }[]
      }
      get_delegate_reports: {
        Args: { date_from?: string; date_to?: string }
        Returns: {
          commission_due: number
          delegate_id: string
          delegate_name: string
          success_rate: number
          total_delayed: number
          total_delivered: number
          total_returned: number
        }[]
      }
      get_monthly_reports: {
        Args: { date_from?: string; date_to?: string }
        Returns: {
          month_year: string
          total_commissions: number
          total_revenue: number
          total_shipments: number
        }[]
      }
      get_reports_stats: {
        Args: { date_from?: string; date_to?: string }
        Returns: {
          delayed_count: number
          delivered_count: number
          pending_count: number
          returned_count: number
          total_commissions: number
          total_revenue: number
          total_shipments: number
          transit_count: number
        }[]
      }
      get_shipment_by_tracking: {
        Args: { p_phone_last_4: string; p_tracking_number: string }
        Returns: {
          cod_amount: number
          created_at: string
          delivered_at: string
          id: string
          recipient_city: string
          recipient_name: string
          shipping_fee: number
          status: string
          tracking_number: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_wallet_report: {
        Args: { p_date_from?: string; p_date_to?: string; p_user_id: string }
        Returns: {
          amount: number
          notes: string
          payment_method: string
          reference_number: string
          transaction_date: string
          transaction_id: string
          transaction_type: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reset_wallet_balance: { Args: { p_user_id: string }; Returns: undefined }
      update_pickup_request_status: {
        Args: { p_new_status: string; p_request_id: string }
        Returns: undefined
      }
      update_sheet_statistics: {
        Args: {
          p_completed_shipments: number
          p_pending_shipments: number
          p_sheet_id: string
          p_total_shipments: number
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "head_manager" | "user" | "guest"
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
      app_role: ["head_manager", "user", "guest"],
    },
  },
} as const
