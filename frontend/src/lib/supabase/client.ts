import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export function createClient(): SupabaseClient<Database> {
  const { publishableKey, url } = getSupabaseEnv();

  return createBrowserClient<Database>(url, publishableKey);
}
