import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createDemoClient } from "@/lib/supabase/demo";
import { getSupabaseEnv, isSupabaseDemoMode } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export function createClient(): SupabaseClient<Database> {
  if (isSupabaseDemoMode()) return createDemoClient();
  const { publishableKey, url } = getSupabaseEnv();
  return createBrowserClient<Database>(url, publishableKey);
}