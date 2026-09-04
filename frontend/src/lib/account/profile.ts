import "server-only";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createClient } from "@/lib/supabase/server";

export type AccountProfile = {
  birthDate?: string;
  createdAt: string;
  email: string;
  firstName?: string;
  lastName?: string;
  newsletterSubscribed: boolean;
  phone?: string;
};

function getMetadataText(
  metadata: Record<string, unknown>,
  key: "first_name" | "last_name" | "phone",
) {
  const value = metadata[key];

  return typeof value === "string" ? value.trim() : "";
}

export async function getCurrentAccountProfile(): Promise<AccountProfile | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "first_name,last_name,phone,birth_date,newsletter_subscribed,created_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  return {
    birthDate: profile?.birth_date ?? undefined,
    createdAt: profile?.created_at ?? user.created_at,
    email: user.email ?? "",
    firstName:
      profile?.first_name ?? getMetadataText(user.user_metadata, "first_name"),
    lastName:
      profile?.last_name ?? getMetadataText(user.user_metadata, "last_name"),
    newsletterSubscribed: Boolean(profile?.newsletter_subscribed),
    phone: profile?.phone ?? getMetadataText(user.user_metadata, "phone"),
  };
}
