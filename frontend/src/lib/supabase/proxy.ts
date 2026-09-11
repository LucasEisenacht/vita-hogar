import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createDemoClient } from "@/lib/supabase/demo";
import { getSupabaseEnv, isSupabaseDemoMode } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

type SupabaseProxyResult = { response: NextResponse; supabase: SupabaseClient<Database>; user: User | null };

export async function updateSession(request: NextRequest): Promise<SupabaseProxyResult> {
  if (isSupabaseDemoMode()) return { response: NextResponse.next({ request }), supabase: createDemoClient(), user: null };
  const { publishableKey, url } = getSupabaseEnv();
  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, options, value }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  return { response, supabase, user };
}