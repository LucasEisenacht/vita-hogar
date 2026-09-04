import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getCurrentUserAddresses } from "@/lib/account/addresses";
import { createNoIndexMetadata } from "@/lib/seo/metadata";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = createNoIndexMetadata({
  description: "Checkout privado de W.todocell.",
  title: "Checkout | W.todocell",
});

function getMetadataText(
  metadata: Record<string, unknown>,
  key: "first_name" | "last_name" | "phone",
) {
  const value = metadata[key];

  return typeof value === "string" ? value : "";
}

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("first_name,last_name,phone")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };
  const initialCustomer = user
    ? {
        email: user.email ?? "",
        firstName:
          profile?.first_name ??
          getMetadataText(user.user_metadata, "first_name"),
        lastName:
          profile?.last_name ??
          getMetadataText(user.user_metadata, "last_name"),
        phone: profile?.phone ?? getMetadataText(user.user_metadata, "phone"),
      }
    : undefined;
  const initialAddresses = user ? await getCurrentUserAddresses() : [];

  return (
    <CheckoutForm
      initialAddresses={initialAddresses}
      initialCustomer={initialCustomer}
    />
  );
}
