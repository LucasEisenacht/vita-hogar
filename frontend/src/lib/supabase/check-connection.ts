import { createClient } from "@/lib/supabase/server";

export type SupabaseConnectionStatus = {
  message: string;
  ok: boolean;
};

export async function checkSupabaseConnection(): Promise<SupabaseConnectionStatus> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.getUser();

    if (!error || error.name === "AuthSessionMissingError") {
      return {
        message: "Supabase server client initialized.",
        ok: true,
      };
    }

    return {
      message: "Supabase responded, but the current auth state is not valid.",
      ok: false,
    };
  } catch {
    return {
      message: "Supabase server client could not be initialized.",
      ok: false,
    };
  }
}
