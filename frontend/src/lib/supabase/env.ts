type SupabaseEnv = {
  publishableKey: string;
  url: string;
};

function validateRequiredEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Add it to .env.local before using Supabase.`,
    );
  }

  return value;
}

export function getSupabaseEnv(): SupabaseEnv {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  return {
    publishableKey: validateRequiredEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      supabasePublishableKey,
    ),
    url: validateRequiredEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl),
  };
}
