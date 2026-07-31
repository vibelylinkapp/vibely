// Hand-trimmed database types for the tables the app touches today.
// Regenerate the full set anytime with:
//   npx supabase gen types typescript --project-id gimllbqpcytshovqdnfm > lib/database.types.ts
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
          area: string | null;
          avatar_url: string | null;
          banned_at: string | null;
          banned_reason: string | null;
          bio: string | null;
          birthdate: string | null;
          county: string | null;
          cover_url: string | null;
          created_at: string;
          display_name: string;
          education: string | null;
          gender: Database["public"]["Enums"]["gender_t"] | null;
          geo: unknown;
          handle: string | null;
          height_cm: number | null;
          id: string;
          invisible_mode: boolean;
          is_admin: boolean;
          is_banned: boolean;
          is_online: boolean;
          is_private: boolean;
          is_verified: boolean | null;
          languages: string[] | null;
          last_active_at: string | null;
          occupation: string | null;
          onboarding_done: boolean;
          religion: string | null;
          safety_score: number;
          updated_at: string;
          verification: Database["public"]["Enums"]["verification_t"];
        };
        Insert: {
          area?: string | null;
          avatar_url?: string | null;
          banned_at?: string | null;
          banned_reason?: string | null;
          bio?: string | null;
          birthdate?: string | null;
          county?: string | null;
          cover_url?: string | null;
          created_at?: string;
          display_name: string;
          education?: string | null;
          gender?: Database["public"]["Enums"]["gender_t"] | null;
          geo?: unknown;
          handle?: string | null;
          height_cm?: number | null;
          id: string;
          invisible_mode?: boolean;
          is_admin?: boolean;
          is_banned?: boolean;
          is_online?: boolean;
          is_private?: boolean;
          is_verified?: boolean | null;
          languages?: string[] | null;
          last_active_at?: string | null;
          occupation?: string | null;
          onboarding_done?: boolean;
          religion?: string | null;
          safety_score?: number;
          updated_at?: string;
          verification?: Database["public"]["Enums"]["verification_t"];
        };
        Update: {
          area?: string | null;
          avatar_url?: string | null;
          banned_at?: string | null;
          banned_reason?: string | null;
          bio?: string | null;
          birthdate?: string | null;
          county?: string | null;
          cover_url?: string | null;
          created_at?: string;
          display_name?: string;
          education?: string | null;
          gender?: Database["public"]["Enums"]["gender_t"] | null;
          geo?: unknown;
          handle?: string | null;
          height_cm?: number | null;
          id?: string;
          invisible_mode?: boolean;
          is_admin?: boolean;
          is_banned?: boolean;
          is_online?: boolean;
          is_private?: boolean;
          is_verified?: boolean | null;
          languages?: string[] | null;
          last_active_at?: string | null;
          occupation?: string | null;
          onboarding_done?: boolean;
          religion?: string | null;
          safety_score?: number;
          updated_at?: string;
          verification?: Database["public"]["Enums"]["verification_t"];
        };
        Relationships: [];
      };
      profile_intents: {
        Row: {
          intent: Database["public"]["Enums"]["intent_t"];
          profile_id: string;
        };
        Insert: {
          intent: Database["public"]["Enums"]["intent_t"];
          profile_id: string;
        };
        Update: {
          intent?: Database["public"]["Enums"]["intent_t"];
          profile_id?: string;
        };
        Relationships: [];
      };
      blocks: {
        Row: { blocked_id: string; blocker_id: string; created_at: string };
        Insert: { blocked_id: string; blocker_id: string; created_at?: string };
        Update: { blocked_id?: string; blocker_id?: string; created_at?: string };
        Relationships: [];
      };
      likes: {
        Row: { created_at: string; liked_id: string; liker_id: string };
        Insert: { created_at?: string; liked_id: string; liker_id: string };
        Update: { created_at?: string; liked_id?: string; liker_id?: string };
        Relationships: [];
      };
      stories: {
        Row: {
          caption: string | null;
          created_at: string;
          expires_at: string;
          id: string;
          is_approved: boolean;
          media_url: string;
          mood: string | null;
          profile_id: string;
        };
        Insert: {
          caption?: string | null;
          created_at?: string;
          expires_at?: string;
          id?: string;
          is_approved?: boolean;
          media_url: string;
          mood?: string | null;
          profile_id: string;
        };
        Update: {
          caption?: string | null;
          created_at?: string;
          expires_at?: string;
          id?: string;
          is_approved?: boolean;
          media_url?: string;
          mood?: string | null;
          profile_id?: string;
        };
        Relationships: [];
      };
      plans: {
        Row: {
          category: string;
          county: string | null;
          created_at: string;
          description: string | null;
          geo: unknown;
          host_id: string;
          id: string;
          max_people: number | null;
          starts_at: string | null;
          status: Database["public"]["Enums"]["plan_status_t"];
          title: string;
        };
        Insert: {
          category: string;
          county?: string | null;
          created_at?: string;
          description?: string | null;
          geo?: unknown;
          host_id: string;
          id?: string;
          max_people?: number | null;
          starts_at?: string | null;
          status?: Database["public"]["Enums"]["plan_status_t"];
          title: string;
        };
        Update: {
          category?: string;
          county?: string | null;
          created_at?: string;
          description?: string | null;
          geo?: unknown;
          host_id?: string;
          id?: string;
          max_people?: number | null;
          starts_at?: string | null;
          status?: Database["public"]["Enums"]["plan_status_t"];
          title?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          author_id: string;
          caption: string | null;
          created_at: string;
          id: string;
          media_url: string | null;
        };
        Insert: {
          author_id: string;
          caption?: string | null;
          created_at?: string;
          id?: string;
          media_url?: string | null;
        };
        Update: {
          author_id?: string;
          caption?: string | null;
          created_at?: string;
          id?: string;
          media_url?: string | null;
        };
        Relationships: [];
      };
      post_likes: {
        Row: {
          created_at: string;
          post_id: string;
          profile_id: string;
        };
        Insert: {
          created_at?: string;
          post_id: string;
          profile_id: string;
        };
        Update: {
          created_at?: string;
          post_id?: string;
          profile_id?: string;
        };
        Relationships: [];
      };
      post_comments: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          id: string;
          post_id: string;
        };
        Insert: {
          author_id: string;
          body: string;
          created_at?: string;
          id?: string;
          post_id: string;
        };
        Update: {
          author_id?: string;
          body?: string;
          created_at?: string;
          id?: string;
          post_id?: string;
        };
        Relationships: [];
      };
      plan_participants: {
        Row: { joined_at: string; plan_id: string; profile_id: string };
        Insert: { joined_at?: string; plan_id: string; profile_id: string };
        Update: { joined_at?: string; plan_id?: string; profile_id?: string };
        Relationships: [];
      };
      photos: {
        Row: {
          created_at: string;
          id: string;
          is_approved: boolean;
          position: number;
          profile_id: string;
          url: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_approved?: boolean;
          position?: number;
          profile_id: string;
          url: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_approved?: boolean;
          position?: number;
          profile_id?: string;
          url?: string;
        };
        Relationships: [];
      };
      boosts: {
        Row: {
          created_at: string;
          expires_at: string;
          id: string;
          profile_id: string;
          started_at: string;
        };
        Insert: {
          created_at?: string;
          expires_at: string;
          id?: string;
          profile_id: string;
          started_at?: string;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          id?: string;
          profile_id?: string;
          started_at?: string;
        };
        Relationships: [];
      };
      nudges: {
        Row: {
          created_at: string;
          id: string;
          kind: string;
          profile_id: string;
          ref: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          kind: string;
          profile_id: string;
          ref?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          kind?: string;
          profile_id?: string;
          ref?: string | null;
        };
        Relationships: [];
      };
      profile_views: {
        Row: {
          viewed_at: string;
          viewed_id: string;
          viewer_id: string;
        };
        Insert: {
          viewed_at?: string;
          viewed_id: string;
          viewer_id: string;
        };
        Update: {
          viewed_at?: string;
          viewed_id?: string;
          viewer_id?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount_kes: number;
          created_at: string;
          id: string;
          mpesa_checkout_id: string | null;
          mpesa_receipt: string | null;
          phone: string | null;
          profile_id: string | null;
          provider: string;
          raw_callback: Json | null;
          status: string;
          tier: Database["public"]["Enums"]["sub_tier_t"] | null;
        };
        Insert: {
          amount_kes: number;
          created_at?: string;
          id?: string;
          mpesa_checkout_id?: string | null;
          mpesa_receipt?: string | null;
          phone?: string | null;
          profile_id?: string | null;
          provider?: string;
          raw_callback?: Json | null;
          status?: string;
          tier?: Database["public"]["Enums"]["sub_tier_t"] | null;
        };
        Update: {
          amount_kes?: number;
          created_at?: string;
          id?: string;
          mpesa_checkout_id?: string | null;
          mpesa_receipt?: string | null;
          phone?: string | null;
          profile_id?: string | null;
          provider?: string;
          raw_callback?: Json | null;
          status?: string;
          tier?: Database["public"]["Enums"]["sub_tier_t"] | null;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          created_at: string;
          expires_at: string | null;
          id: string;
          profile_id: string;
          started_at: string;
          status: Database["public"]["Enums"]["sub_status_t"];
          tier: Database["public"]["Enums"]["sub_tier_t"];
        };
        Insert: {
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          profile_id: string;
          started_at?: string;
          status?: Database["public"]["Enums"]["sub_status_t"];
          tier?: Database["public"]["Enums"]["sub_tier_t"];
        };
        Update: {
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          profile_id?: string;
          started_at?: string;
          status?: Database["public"]["Enums"]["sub_status_t"];
          tier?: Database["public"]["Enums"]["sub_tier_t"];
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          created_at: string;
          endpoint: string;
          id: string;
          profile_id: string;
          subscription: Json;
        };
        Insert: {
          created_at?: string;
          endpoint: string;
          id?: string;
          profile_id: string;
          subscription: Json;
        };
        Update: {
          created_at?: string;
          endpoint?: string;
          id?: string;
          profile_id?: string;
          subscription?: Json;
        };
        Relationships: [];
      };
      verification_requests: {
        Row: {
          created_at: string;
          doc_path: string | null;
          id: string;
          kind: Database["public"]["Enums"]["verification_t"];
          note: string | null;
          profile_id: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          selfie_path: string;
          status: Database["public"]["Enums"]["verif_status_t"];
        };
        Insert: {
          created_at?: string;
          doc_path?: string | null;
          id?: string;
          kind: Database["public"]["Enums"]["verification_t"];
          note?: string | null;
          profile_id: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          selfie_path: string;
          status?: Database["public"]["Enums"]["verif_status_t"];
        };
        Update: {
          created_at?: string;
          doc_path?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["verification_t"];
          note?: string | null;
          profile_id?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          selfie_path?: string;
          status?: Database["public"]["Enums"]["verif_status_t"];
        };
        Relationships: [];
      };
      reports: {
        Row: {
          created_at: string;
          detail: string | null;
          id: string;
          reason: string;
          reported_id: string | null;
          reporter_id: string | null;
          resolved_at: string | null;
          status: Database["public"]["Enums"]["report_status_t"];
        };
        Insert: {
          created_at?: string;
          detail?: string | null;
          id?: string;
          reason: string;
          reported_id?: string | null;
          reporter_id?: string | null;
          resolved_at?: string | null;
          status?: Database["public"]["Enums"]["report_status_t"];
        };
        Update: {
          created_at?: string;
          detail?: string | null;
          id?: string;
          reason?: string;
          reported_id?: string | null;
          reporter_id?: string | null;
          resolved_at?: string | null;
          status?: Database["public"]["Enums"]["report_status_t"];
        };
        Relationships: [];
      };
      admin_actions: {
        Row: {
          action: string;
          admin_id: string | null;
          created_at: string;
          detail: string | null;
          id: string;
          target_id: string | null;
        };
        Insert: {
          action: string;
          admin_id?: string | null;
          created_at?: string;
          detail?: string | null;
          id?: string;
          target_id?: string | null;
        };
        Update: {
          action?: string;
          admin_id?: string | null;
          created_at?: string;
          detail?: string | null;
          id?: string;
          target_id?: string | null;
        };
        Relationships: [];
      };
      conversations: {
        Row: { created_at: string; id: string; last_msg_at: string | null };
        Insert: { created_at?: string; id?: string; last_msg_at?: string | null };
        Update: { created_at?: string; id?: string; last_msg_at?: string | null };
        Relationships: [];
      };
      conversation_members: {
        Row: {
          conversation_id: string;
          last_read_at: string | null;
          profile_id: string;
        };
        Insert: {
          conversation_id: string;
          last_read_at?: string | null;
          profile_id: string;
        };
        Update: {
          conversation_id?: string;
          last_read_at?: string | null;
          profile_id?: string;
        };
        Relationships: [];
      };
      message_reactions: {
        Row: {
          created_at: string;
          emoji: string;
          message_id: string;
          profile_id: string;
        };
        Insert: {
          created_at?: string;
          emoji: string;
          message_id: string;
          profile_id: string;
        };
        Update: {
          created_at?: string;
          emoji?: string;
          message_id?: string;
          profile_id?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          body: string | null;
          conversation_id: string;
          created_at: string;
          deleted_at: string | null;
          edited_at: string | null;
          id: string;
          is_flagged: boolean;
          kind: Database["public"]["Enums"]["message_kind_t"];
          media_url: string | null;
          sender_id: string;
        };
        Insert: {
          body?: string | null;
          conversation_id: string;
          created_at?: string;
          deleted_at?: string | null;
          edited_at?: string | null;
          id?: string;
          is_flagged?: boolean;
          kind?: Database["public"]["Enums"]["message_kind_t"];
          media_url?: string | null;
          sender_id: string;
        };
        Update: {
          body?: string | null;
          conversation_id?: string;
          created_at?: string;
          deleted_at?: string | null;
          edited_at?: string | null;
          id?: string;
          is_flagged?: boolean;
          kind?: Database["public"]["Enums"]["message_kind_t"];
          media_url?: string | null;
          sender_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      matches: {
        Row: {
          u1: string | null;
          u2: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      nearby_profiles: {
        Args: {
          in_lat: number;
          in_lng: number;
          radius_m?: number;
          wanted?: Database["public"]["Enums"]["intent_t"];
        };
        Returns: {
          avatar_url: string;
          county: string;
          display_name: string;
          distance_m: number;
          id: string;
          is_online: boolean;
          is_verified: boolean;
        }[];
      };
      start_conversation: {
        Args: { other_id: string };
        Returns: string;
      };
    };
    Enums: {
      gender_t: "male" | "female" | "nonbinary" | "other";
      intent_t:
        | "dating"
        | "friendship"
        | "hangout"
        | "weekend"
        | "gym"
        | "hiking"
        | "coffee"
        | "networking"
        | "business"
        | "travel"
        | "movies"
        | "nightlife";
      message_kind_t:
        | "text"
        | "image"
        | "video"
        | "voice"
        | "system"
        | "meet_request";
      plan_status_t: "open" | "full" | "closed" | "cancelled";
      report_status_t: "open" | "reviewing" | "actioned" | "dismissed";
      sub_status_t: "active" | "past_due" | "cancelled" | "expired";
      sub_tier_t: "free" | "plus" | "gold" | "vip";
      verification_t: "none" | "phone" | "selfie" | "national_id" | "passport";
      verif_status_t: "pending" | "approved" | "rejected";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
