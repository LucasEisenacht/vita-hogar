export type Json =
  | boolean
  | null
  | number
  | string
  | { [key: string]: Json | undefined }
  | Array<Json>;

export type Database = {
  public: {
    Tables: {
      auth_email_outbox: {
        Row: {
          attempts: number;
          created_at: string;
          event_type: AuthEmailEventType;
          id: string;
          last_error: string | null;
          next_attempt_at: string | null;
          payload: Json;
          provider_message_id: string | null;
          recipient_email: string;
          sent_at: string | null;
          status: AuthEmailStatus;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          attempts?: number;
          created_at?: string;
          event_type: AuthEmailEventType;
          id?: string;
          last_error?: string | null;
          next_attempt_at?: string | null;
          payload?: Json;
          provider_message_id?: string | null;
          recipient_email: string;
          sent_at?: string | null;
          status?: AuthEmailStatus;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          attempts?: number;
          created_at?: string;
          event_type?: AuthEmailEventType;
          id?: string;
          last_error?: string | null;
          next_attempt_at?: string | null;
          payload?: Json;
          provider_message_id?: string | null;
          recipient_email?: string;
          sent_at?: string | null;
          status?: AuthEmailStatus;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          name: string;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      favorites: {
        Row: {
          created_at: string;
          product_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          product_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          product_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      home_content: {
        Row: {
          content: Json;
          created_at: string;
          id: string;
          is_active: boolean;
          key: string;
          updated_at: string;
        };
        Insert: {
          content: Json;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          key: string;
          updated_at?: string;
        };
        Update: {
          content?: Json;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          key?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_role_audit_log: {
        Row: {
          action: "assign" | "demote" | "no_change" | "promote" | "revoke";
          changed_by: string | null;
          created_at: string;
          id: string;
          new_role: AppRole;
          previous_role: AppRole | null;
          reason: string | null;
          request_ip_hash: string | null;
          target_user_id: string;
        };
        Insert: {
          action: "assign" | "demote" | "no_change" | "promote" | "revoke";
          changed_by?: string | null;
          created_at?: string;
          id?: string;
          new_role: AppRole;
          previous_role?: AppRole | null;
          reason?: string | null;
          request_ip_hash?: string | null;
          target_user_id: string;
        };
        Update: {
          action?: "assign" | "demote" | "no_change" | "promote" | "revoke";
          changed_by?: string | null;
          created_at?: string;
          id?: string;
          new_role?: AppRole;
          previous_role?: AppRole | null;
          reason?: string | null;
          request_ip_hash?: string | null;
          target_user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          birth_date: string | null;
          created_at: string;
          first_name: string | null;
          id: string;
          last_name: string | null;
          newsletter_subscribed: boolean;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          birth_date?: string | null;
          created_at?: string;
          first_name?: string | null;
          id: string;
          last_name?: string | null;
          newsletter_subscribed?: boolean;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          birth_date?: string | null;
          created_at?: string;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          newsletter_subscribed?: boolean;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_addresses: {
        Row: {
          created_at: string;
          floor_apartment: string | null;
          id: string;
          is_default: boolean;
          label: string;
          locality: string;
          municipality: string | null;
          phone: string;
          postal_code: string;
          province: string;
          recipient_name: string;
          reference: string | null;
          street: string;
          street_number: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          floor_apartment?: string | null;
          id?: string;
          is_default?: boolean;
          label: string;
          locality: string;
          municipality?: string | null;
          phone: string;
          postal_code: string;
          province: string;
          recipient_name: string;
          reference?: string | null;
          street: string;
          street_number: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          floor_apartment?: string | null;
          id?: string;
          is_default?: boolean;
          label?: string;
          locality?: string;
          municipality?: string | null;
          phone?: string;
          postal_code?: string;
          province?: string;
          recipient_name?: string;
          reference?: string | null;
          street?: string;
          street_number?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          availability_type: ProductAvailabilityType;
          created_at: string;
          id: string;
          image_url: string | null;
          line_total: number;
          order_id: string;
          product_condition: ProductCondition | null;
          product_id: string | null;
          product_name: string;
          product_slug: string | null;
          quantity: number;
          selected_color: string | null;
          selected_compatibility: string | null;
          unit_price: number;
          variant_brand: string | null;
          variant_id: string | null;
          variant_model: string | null;
        };
        Insert: {
          availability_type?: ProductAvailabilityType;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          line_total: number;
          order_id: string;
          product_condition?: ProductCondition | null;
          product_id?: string | null;
          product_name: string;
          product_slug?: string | null;
          quantity: number;
          selected_color?: string | null;
          selected_compatibility?: string | null;
          unit_price: number;
          variant_brand?: string | null;
          variant_id?: string | null;
          variant_model?: string | null;
        };
        Update: {
          availability_type?: ProductAvailabilityType;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          line_total?: number;
          order_id?: string;
          product_condition?: ProductCondition | null;
          product_id?: string | null;
          product_name?: string;
          product_slug?: string | null;
          quantity?: number;
          selected_color?: string | null;
          selected_compatibility?: string | null;
          unit_price?: number;
          variant_brand?: string | null;
          variant_id?: string | null;
          variant_model?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      order_email_outbox: {
        Row: {
          attempts: number;
          created_at: string;
          event_type: OrderEmailEventType;
          id: string;
          last_error: string | null;
          next_attempt_at: string | null;
          order_id: string;
          payload: Json;
          provider_message_id: string | null;
          recipient_email: string;
          sent_at: string | null;
          status: OrderEmailStatus;
          updated_at: string;
        };
        Insert: {
          attempts?: number;
          created_at?: string;
          event_type: OrderEmailEventType;
          id?: string;
          last_error?: string | null;
          next_attempt_at?: string | null;
          order_id: string;
          payload?: Json;
          provider_message_id?: string | null;
          recipient_email: string;
          sent_at?: string | null;
          status?: OrderEmailStatus;
          updated_at?: string;
        };
        Update: {
          attempts?: number;
          created_at?: string;
          event_type?: OrderEmailEventType;
          id?: string;
          last_error?: string | null;
          next_attempt_at?: string | null;
          order_id?: string;
          payload?: Json;
          provider_message_id?: string | null;
          recipient_email?: string;
          sent_at?: string | null;
          status?: OrderEmailStatus;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_email_outbox_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      order_status_history: {
        Row: {
          changed_by: string | null;
          created_at: string;
          id: string;
          internal_note: string | null;
          new_status: OrderStatus;
          note: string | null;
          order_id: string;
          previous_status: OrderStatus | null;
          public_note: string | null;
        };
        Insert: {
          changed_by?: string | null;
          created_at?: string;
          id?: string;
          internal_note?: string | null;
          new_status: OrderStatus;
          note?: string | null;
          order_id: string;
          previous_status?: OrderStatus | null;
          public_note?: string | null;
        };
        Update: {
          changed_by?: string | null;
          created_at?: string;
          id?: string;
          internal_note?: string | null;
          new_status?: OrderStatus;
          note?: string | null;
          order_id?: string;
          previous_status?: OrderStatus | null;
          public_note?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          admin_notes: string | null;
          cancelled_at: string | null;
          confirmation_token_hash: string;
          confirmation_token_secret_version: number;
          created_at: string;
          currency: "ARS";
          customer_dni: string | null;
          customer_email: string;
          customer_first_name: string;
          customer_last_name: string;
          customer_name: string;
          customer_notes: string | null;
          customer_phone: string;
          delivery_method: DeliveryMethod;
          delivered_at: string | null;
          id: string;
          idempotency_key: string | null;
          order_number: string;
          paid_at: string | null;
          payment_method: PaymentMethod;
          payment_status: PaymentStatus;
          shipped_at: string | null;
          shipping_address: Json | null;
          shipping_cost: number;
          shipping_cost_status: ShippingCostStatus;
          source: string;
          status: OrderStatus;
          stock_restored_at: string | null;
          subtotal: number;
          total: number;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          admin_notes?: string | null;
          cancelled_at?: string | null;
          confirmation_token_hash?: string;
          confirmation_token_secret_version?: number;
          created_at?: string;
          currency?: "ARS";
          customer_dni?: string | null;
          customer_email: string;
          customer_first_name: string;
          customer_last_name: string;
          customer_name: string;
          customer_notes?: string | null;
          customer_phone: string;
          delivery_method: DeliveryMethod;
          delivered_at?: string | null;
          id?: string;
          idempotency_key?: string | null;
          order_number?: string;
          paid_at?: string | null;
          payment_method?: PaymentMethod;
          payment_status?: PaymentStatus;
          shipped_at?: string | null;
          shipping_address?: Json | null;
          shipping_cost?: number;
          shipping_cost_status?: ShippingCostStatus;
          source?: string;
          status?: OrderStatus;
          stock_restored_at?: string | null;
          subtotal: number;
          total: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          admin_notes?: string | null;
          cancelled_at?: string | null;
          confirmation_token_hash?: string;
          confirmation_token_secret_version?: number;
          created_at?: string;
          currency?: "ARS";
          customer_dni?: string | null;
          customer_email?: string;
          customer_first_name?: string;
          customer_last_name?: string;
          customer_name?: string;
          customer_notes?: string | null;
          customer_phone?: string;
          delivery_method?: DeliveryMethod;
          delivered_at?: string | null;
          id?: string;
          idempotency_key?: string | null;
          order_number?: string;
          paid_at?: string | null;
          payment_method?: PaymentMethod;
          payment_status?: PaymentStatus;
          shipped_at?: string | null;
          shipping_address?: Json | null;
          shipping_cost?: number;
          shipping_cost_status?: ShippingCostStatus;
          source?: string;
          status?: OrderStatus;
          stock_restored_at?: string | null;
          subtotal?: number;
          total?: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      products: {
        Row: {
          availability_type: ProductAvailabilityType;
          badge: string | null;
          battery_health: number | null;
          brand: string | null;
          category_id: string | null;
          colors: Array<string>;
          compatibility: Array<string>;
          condition: ProductCondition;
          cosmetic_condition: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          estimated_delivery_text: string | null;
          id: string;
          included_accessories: Array<string>;
          is_active: boolean;
          is_featured: boolean;
          model: string | null;
          name: string;
          previous_price: number | null;
          price: number;
          short_description: string | null;
          slug: string;
          specifications: Json;
          stock: number;
          storage_capacity: string | null;
          technical_details: Json;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          availability_type?: ProductAvailabilityType;
          badge?: string | null;
          battery_health?: number | null;
          brand?: string | null;
          category_id?: string | null;
          colors?: Array<string>;
          compatibility?: Array<string>;
          condition?: ProductCondition;
          cosmetic_condition?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          estimated_delivery_text?: string | null;
          id?: string;
          included_accessories?: Array<string>;
          is_active?: boolean;
          is_featured?: boolean;
          model?: string | null;
          name: string;
          previous_price?: number | null;
          price: number;
          short_description?: string | null;
          slug: string;
          specifications?: Json;
          stock?: number;
          storage_capacity?: string | null;
          technical_details?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          availability_type?: ProductAvailabilityType;
          badge?: string | null;
          battery_health?: number | null;
          brand?: string | null;
          category_id?: string | null;
          colors?: Array<string>;
          compatibility?: Array<string>;
          condition?: ProductCondition;
          cosmetic_condition?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          estimated_delivery_text?: string | null;
          id?: string;
          included_accessories?: Array<string>;
          is_active?: boolean;
          is_featured?: boolean;
          model?: string | null;
          name?: string;
          previous_price?: number | null;
          price?: number;
          short_description?: string | null;
          slug?: string;
          specifications?: Json;
          stock?: number;
          storage_capacity?: string | null;
          technical_details?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      product_images: {
        Row: {
          alt_text: string | null;
          color_key: string | null;
          created_at: string;
          created_by: string | null;
          file_size: number | null;
          height: number | null;
          id: string;
          is_primary: boolean;
          mime_type: string | null;
          product_id: string;
          sort_order: number;
          storage_path: string;
          updated_at: string;
          width: number | null;
        };
        Insert: {
          alt_text?: string | null;
          color_key?: string | null;
          created_at?: string;
          created_by?: string | null;
          file_size?: number | null;
          height?: number | null;
          id?: string;
          is_primary?: boolean;
          mime_type?: string | null;
          product_id: string;
          sort_order?: number;
          storage_path: string;
          updated_at?: string;
          width?: number | null;
        };
        Update: {
          alt_text?: string | null;
          color_key?: string | null;
          created_at?: string;
          created_by?: string | null;
          file_size?: number | null;
          height?: number | null;
          id?: string;
          is_primary?: boolean;
          mime_type?: string | null;
          product_id?: string;
          sort_order?: number;
          storage_path?: string;
          updated_at?: string;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_model_variants: {
        Row: {
          brand: string;
          color_key: string | null;
          color_name: string | null;
          created_at: string;
          id: string;
          is_active: boolean;
          model: string;
          product_id: string;
          stock: number;
          updated_at: string;
        };
        Insert: {
          brand: string;
          color_key?: string | null;
          color_name?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          model: string;
          product_id: string;
          stock?: number;
          updated_at?: string;
        };
        Update: {
          brand?: string;
          color_key?: string | null;
          color_name?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          model?: string;
          product_id?: string;
          stock?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_model_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          role: "customer" | "employee" | "admin" | "super_admin";
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          role?: "customer" | "employee" | "admin" | "super_admin";
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          role?: "customer" | "employee" | "admin" | "super_admin";
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      customer_order_status_history_safe: {
        Row: {
          created_at: string;
          id: string;
          new_status: OrderStatus;
          order_id: string;
          previous_status: OrderStatus | null;
          public_note: string | null;
        };
        Relationships: [];
      };
      customer_orders_safe: {
        Row: {
          cancelled_at: string | null;
          created_at: string;
          currency: "ARS";
          customer_dni: string | null;
          customer_email: string;
          customer_first_name: string;
          customer_last_name: string;
          customer_notes: string | null;
          customer_phone: string;
          delivered_at: string | null;
          delivery_method: DeliveryMethod;
          id: string;
          order_number: string;
          paid_at: string | null;
          payment_method: PaymentMethod;
          payment_status: PaymentStatus;
          shipped_at: string | null;
          shipping_address: Json | null;
          shipping_cost: number;
          shipping_cost_status: ShippingCostStatus;
          status: OrderStatus;
          subtotal: number;
          total: number;
          updated_at: string;
          user_id: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      create_product_with_model_variants: {
        Args: {
          model_variants_payload?: Json;
          product_payload: Json;
        };
        Returns: string;
      };
      create_order: {
        Args: {
          order_payload: Json;
        };
        Returns: Json;
      };
      get_order_confirmation: {
        Args: {
          confirmation_token_value: string;
          order_number_value: string;
        };
        Returns: Json;
      };
      get_admin_order_details: {
        Args: {
          order_id_value: string;
        };
        Returns: Json;
      };
      claim_order_email_outbox: {
        Args: {
          batch_size?: number;
        };
        Returns: Array<
          Database["public"]["Tables"]["order_email_outbox"]["Row"]
        >;
      };
      claim_auth_email_outbox: {
        Args: {
          batch_size?: number;
        };
        Returns: Array<
          Database["public"]["Tables"]["auth_email_outbox"]["Row"]
        >;
      };
      has_admin_access: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      has_role: {
        Args: {
          required_role: "customer" | "employee" | "admin" | "super_admin";
        };
        Returns: boolean;
      };
      manage_user_role: {
        Args: {
          new_role_value: AppRole;
          reason_value?: string | null;
          request_ip_hash_value?: string | null;
          target_user_id_value: string;
        };
        Returns: Json;
      };
      update_order_status: {
        Args: {
          new_status_value: string;
          note_value?: string | null;
          order_id_value: string;
        };
        Returns: Json;
      };
      update_product_with_model_variants: {
        Args: {
          model_variants_payload?: Json;
          product_id_value: string;
          product_payload: Json;
        };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: "customer" | "employee" | "admin" | "super_admin";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type AppRole = Database["public"]["Enums"]["app_role"];
export type DeliveryMethod =
  | "pickup"
  | "amba_courier"
  | "nationwide_shipping";
export type OrderStatus =
  | "pending_payment"
  | "payment_confirmed"
  | "preparing"
  | "ready"
  | "shipped"
  | "delivered"
  | "cancelled";
export type PaymentMethod = "bank_transfer";
export type AuthEmailEventType = "user_welcome";
export type AuthEmailStatus = "failed" | "pending" | "processing" | "sent";
export type OrderEmailEventType =
  | "order_delivered"
  | "order_received"
  | "order_shipped"
  | "payment_confirmed";
export type OrderEmailStatus = "failed" | "pending" | "processing" | "sent";
export type PaymentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "refunded"
  | "cancelled";
export type ProductAvailabilityType = "in_stock" | "made_to_order";
export type ProductCondition = "new" | "used" | "refurbished";
export type ShippingCostStatus = "fixed" | "to_be_confirmed";
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Favorite = Database["public"]["Tables"]["favorites"]["Row"];
export type FavoriteInsert =
  Database["public"]["Tables"]["favorites"]["Insert"];
export type HomeContent = Database["public"]["Tables"]["home_content"]["Row"];
export type HomeContentInsert =
  Database["public"]["Tables"]["home_content"]["Insert"];
export type HomeContentUpdate =
  Database["public"]["Tables"]["home_content"]["Update"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderEmailOutbox =
  Database["public"]["Tables"]["order_email_outbox"]["Row"];
export type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type OrderItemInsert =
  Database["public"]["Tables"]["order_items"]["Insert"];
export type OrderStatusHistory =
  Database["public"]["Tables"]["order_status_history"]["Row"];
export type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductImage = Database["public"]["Tables"]["product_images"]["Row"];
export type ProductImageInsert =
  Database["public"]["Tables"]["product_images"]["Insert"];
export type ProductImageUpdate =
  Database["public"]["Tables"]["product_images"]["Update"];
export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
export type ProductModelVariant =
  Database["public"]["Tables"]["product_model_variants"]["Row"];
export type ProductModelVariantInsert =
  Database["public"]["Tables"]["product_model_variants"]["Insert"];
export type ProductSpecification = Record<string, string>;
export type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];
export type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];
export type UserAddress =
  Database["public"]["Tables"]["user_addresses"]["Row"];
export type UserAddressInsert =
  Database["public"]["Tables"]["user_addresses"]["Insert"];
export type UserAddressUpdate =
  Database["public"]["Tables"]["user_addresses"]["Update"];
