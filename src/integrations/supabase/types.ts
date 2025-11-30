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
      expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          description: string
          expense_date: string
          id: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          description: string
          expense_date?: string
          id?: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          description?: string
          expense_date?: string
          id?: string
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          additional_costs: number | null
          brand: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_visible: boolean | null
          name: string
          profit_margin: number | null
          purchase_price: number | null
          sale_price: number
          shipping_miami: number | null
          shipping_paraguay: number | null
          sku: string
          stock_quantity: number | null
          units_per_package: number | null
          updated_at: string | null
        }
        Insert: {
          additional_costs?: number | null
          brand?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_visible?: boolean | null
          name: string
          profit_margin?: number | null
          purchase_price?: number | null
          sale_price: number
          shipping_miami?: number | null
          shipping_paraguay?: number | null
          sku: string
          stock_quantity?: number | null
          units_per_package?: number | null
          updated_at?: string | null
        }
        Update: {
          additional_costs?: number | null
          brand?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_visible?: boolean | null
          name?: string
          profit_margin?: number | null
          purchase_price?: number | null
          sale_price?: number
          shipping_miami?: number | null
          shipping_paraguay?: number | null
          sku?: string
          stock_quantity?: number | null
          units_per_package?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          additional_costs: number | null
          created_at: string | null
          discounts: number | null
          exchange_rate: number
          id: string
          notes: string | null
          order_number: string
          product_id: string | null
          purchase_date: string
          quantity: number
          shipping_miami: number | null
          shipping_paraguay: number | null
          status: string | null
          total_cost: number | null
          tracking_number: string | null
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          additional_costs?: number | null
          created_at?: string | null
          discounts?: number | null
          exchange_rate: number
          id?: string
          notes?: string | null
          order_number: string
          product_id?: string | null
          purchase_date: string
          quantity: number
          shipping_miami?: number | null
          shipping_paraguay?: number | null
          status?: string | null
          total_cost?: number | null
          tracking_number?: string | null
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          additional_costs?: number | null
          created_at?: string | null
          discounts?: number | null
          exchange_rate?: number
          id?: string
          notes?: string | null
          order_number?: string
          product_id?: string | null
          purchase_date?: string
          quantity?: number
          shipping_miami?: number | null
          shipping_paraguay?: number | null
          status?: string | null
          total_cost?: number | null
          tracking_number?: string | null
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          acquisition_method: string | null
          created_at: string | null
          customer_name: string
          id: string
          notes: string | null
          payment_method: string | null
          product_id: string | null
          quantity: number
          receipt_number: string | null
          sale_date: string
          sale_price: number
          total: number | null
          updated_at: string | null
        }
        Insert: {
          acquisition_method?: string | null
          created_at?: string | null
          customer_name: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          product_id?: string | null
          quantity: number
          receipt_number?: string | null
          sale_date?: string
          sale_price: number
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          acquisition_method?: string | null
          created_at?: string | null
          customer_name?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          product_id?: string | null
          quantity?: number
          receipt_number?: string | null
          sale_date?: string
          sale_price?: number
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
