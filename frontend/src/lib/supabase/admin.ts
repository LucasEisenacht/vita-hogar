import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

function getServiceRoleKey() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return serviceRoleKey;
}

export function createAdminClient() {
  const { url } = getSupabaseEnv();

  return createSupabaseClient<Database>(url, getServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
