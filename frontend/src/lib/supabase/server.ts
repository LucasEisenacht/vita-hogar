import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();
  const { publishableKey, url } = getSupabaseEnv();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, options, value }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot mutate cookies; src/proxy.ts refreshes them.
        }
      },
    },
  });
}
