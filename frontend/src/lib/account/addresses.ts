import "server-only";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createClient } from "@/lib/supabase/server";
import type { UserAddress } from "@/types/database";

export type AccountAddress = UserAddress;

export async function getCurrentUserAddresses(): Promise<Array<AccountAddress>> {
  const user = await getCurrentUser();

  if (!user) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) {
    return [];
  }

  return data ?? [];
}

export async function getAddressCountsForCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      addresses: 0,
      favorites: 0,
      orders: 0,
    };
  }

  const supabase = await createClient();
  const [addresses, favorites, orders] = await Promise.all([
    supabase
      .from("user_addresses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("favorites")
      .select("product_id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  return {
    addresses: addresses.count ?? 0,
    favorites: favorites.count ?? 0,
    orders: orders.count ?? 0,
  };
}
