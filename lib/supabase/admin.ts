import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// SERVER-ONLY Supabase client using the service-role key.
// It bypasses Row Level Security, so never import this into a client component.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
