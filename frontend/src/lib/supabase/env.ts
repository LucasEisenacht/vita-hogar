export type SupabaseEnv = {
  publishableKey: string;
  url: string;
};

const DEMO_MODE_ENV = "NEXT_PUBLIC_VITA_DEMO_MODE";

export function isExplicitSupabaseDemoMode() {
  return process.env[DEMO_MODE_ENV] === "true";
}

export function isSupabaseDemoMode() {
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasPublishableKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  if (isExplicitSupabaseDemoMode()) {
    return true;
  }

  if (!hasUrl && !hasPublishableKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `Supabase configuration is required in production. Configure both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, or set ${DEMO_MODE_ENV}=true for an intentional preview/demo deployment.`,
      );
    }

    return true;
  }

  if (!hasUrl || !hasPublishableKey) {
    throw new Error(
      `Supabase configuration is incomplete. Set both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, or set ${DEMO_MODE_ENV}=true for preview/demo mode.`,
    );
  }

  return false;
}

function validateRequiredEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Add it to .env.local before using Supabase.`,
    );
  }

  return value;
}

export function getSupabaseEnv(): SupabaseEnv {
  return {
    publishableKey: validateRequiredEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ),
    url: validateRequiredEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
  };
}
