import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type DemoResult = { data: unknown; error: null };

class DemoQueryBuilder implements PromiseLike<DemoResult> {
  private single = false;

  select() { return this; }
  insert() { return this; }
  update() { return this; }
  upsert() { return this; }
  delete() { return this; }
  eq() { return this; }
  neq() { return this; }
  in() { return this; }
  is() { return this; }
  ilike() { return this; }
  or() { return this; }
  order() { return this; }
  limit() { return this; }
  range() { return this; }
  maybeSingle() { this.single = true; return this; }
  singleResult() { this.single = true; return this; }

  then<TResult1 = DemoResult, TResult2 = never>(
    onfulfilled?: ((value: DemoResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    const result: DemoResult = { data: this.single ? null : [], error: null };
    return Promise.resolve(result).then(onfulfilled, onrejected);
  }
}

const demoAuthError = {
  message: "La autenticación está deshabilitada en modo demo local.",
};

export function createDemoClient(): SupabaseClient<Database> {
  const client = {
    from: () => new DemoQueryBuilder(),
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: demoAuthError }),
      signUp: async () => ({ data: { user: null, session: null }, error: demoAuthError }),
      signOut: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({ data: null, error: demoAuthError }),
      updateUser: async () => ({ data: { user: null }, error: demoAuthError }),
      exchangeCodeForSession: async () => ({ data: { user: null, session: null }, error: demoAuthError }),
      verifyOtp: async () => ({ data: { user: null, session: null }, error: demoAuthError }),
      admin: {
        listUsers: async () => ({ data: { users: [], aud: 0 }, error: null }),
        getUserById: async () => ({ data: { user: null }, error: null }),
      },
    },
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: demoAuthError }),
        remove: async () => ({ data: null, error: demoAuthError }),
        copy: async () => ({ data: null, error: demoAuthError }),
        createSignedUrl: async () => ({ data: null, error: demoAuthError }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
      }),
    },
  };

  return client as unknown as SupabaseClient<Database>;
}