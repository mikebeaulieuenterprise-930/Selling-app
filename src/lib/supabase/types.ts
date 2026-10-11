// Types de la base, écrits à la main pour suivre supabase/migrations/*.sql.
// Si tu modifies le schéma, mets ce fichier à jour (ou génère-le avec
// `supabase gen types typescript`).

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          locale: string;
          timezone: string | null;
          onboarding_done: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          locale?: string;
          timezone?: string | null;
          onboarding_done?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          locale?: string;
          timezone?: string | null;
          onboarding_done?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      offers: {
        Row: {
          id: string;
          user_id: string;
          product_name: string;
          product_description: string;
          price_hint: string | null;
          customer_types: string[];
          customer_detail: string | null;
          channels: string[];
          problems: string[];
          problem_detail: string | null;
          ai: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          product_name: string;
          product_description: string;
          price_hint?: string | null;
          customer_types?: string[];
          customer_detail?: string | null;
          channels?: string[];
          problems?: string[];
          problem_detail?: string | null;
          ai?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_name?: string;
          product_description?: string;
          price_hint?: string | null;
          customer_types?: string[];
          customer_detail?: string | null;
          channels?: string[];
          problems?: string[];
          problem_detail?: string | null;
          ai?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      segments: {
        Row: {
          id: string;
          user_id: string;
          offer_id: string | null;
          name: string;
          description: string | null;
          need_score: number;
          budget_score: number;
          reach_score: number;
          total_score: number;
          reason: string | null;
          where_to_find: string[];
          buying_signals: string[];
          first_message_angle: string | null;
          is_priority: boolean;
          rank: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          offer_id?: string | null;
          name: string;
          description?: string | null;
          need_score?: number;
          budget_score?: number;
          reach_score?: number;
          total_score?: number;
          reason?: string | null;
          where_to_find?: string[];
          buying_signals?: string[];
          first_message_angle?: string | null;
          is_priority?: boolean;
          rank?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          offer_id?: string | null;
          name?: string;
          description?: string | null;
          need_score?: number;
          budget_score?: number;
          reach_score?: number;
          total_score?: number;
          reason?: string | null;
          where_to_find?: string[];
          buying_signals?: string[];
          first_message_angle?: string | null;
          is_priority?: boolean;
          rank?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          user_id: string;
          segment_id: string | null;
          name: string;
          company: string | null;
          role: string | null;
          phone: string | null;
          email: string | null;
          channel: string;
          status: string;
          temperature: string | null;
          notes: string | null;
          last_contact_at: string | null;
          last_inbound_at: string | null;
          next_follow_up_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          segment_id?: string | null;
          name: string;
          company?: string | null;
          role?: string | null;
          phone?: string | null;
          email?: string | null;
          channel?: string;
          status?: string;
          temperature?: string | null;
          notes?: string | null;
          last_contact_at?: string | null;
          last_inbound_at?: string | null;
          next_follow_up_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          segment_id?: string | null;
          name?: string;
          company?: string | null;
          role?: string | null;
          phone?: string | null;
          email?: string | null;
          channel?: string;
          status?: string;
          temperature?: string | null;
          notes?: string | null;
          last_contact_at?: string | null;
          last_inbound_at?: string | null;
          next_follow_up_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reply_analyses: {
        Row: {
          id: string;
          user_id: string;
          lead_id: string | null;
          channel: string;
          lead_message: string;
          analysis: Json;
          reply_draft: string;
          was_sent: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          lead_id?: string | null;
          channel?: string;
          lead_message: string;
          analysis: Json;
          reply_draft: string;
          was_sent?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          lead_id?: string | null;
          channel?: string;
          lead_message?: string;
          analysis?: Json;
          reply_draft?: string;
          was_sent?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      daily_tasks: {
        Row: {
          id: string;
          user_id: string;
          task_date: string;
          kind: string;
          ref_id: string;
          minutes: number;
          payload: Json | null;
          done_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          task_date: string;
          kind: string;
          ref_id?: string;
          minutes?: number;
          payload?: Json | null;
          done_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          task_date?: string;
          kind?: string;
          ref_id?: string;
          minutes?: number;
          payload?: Json | null;
          done_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Profile = Tables<"profiles">;
export type Offer = Tables<"offers">;
export type Segment = Tables<"segments">;
export type Lead = Tables<"leads">;
export type ReplyAnalysis = Tables<"reply_analyses">;
export type DailyTask = Tables<"daily_tasks">;

export const LEAD_CHANNELS = ["sms", "email", "call", "linkedin", "in_person", "other"] as const;
export type LeadChannel = (typeof LEAD_CHANNELS)[number];

export const LEAD_STATUSES = ["new", "contacted", "replied", "call_booked", "won", "lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_TEMPERATURES = ["hot", "warm", "cold"] as const;
export type LeadTemperature = (typeof LEAD_TEMPERATURES)[number];

export function isLeadChannel(v: unknown): v is LeadChannel {
  return typeof v === "string" && (LEAD_CHANNELS as readonly string[]).includes(v);
}
export function isLeadStatus(v: unknown): v is LeadStatus {
  return typeof v === "string" && (LEAD_STATUSES as readonly string[]).includes(v);
}
