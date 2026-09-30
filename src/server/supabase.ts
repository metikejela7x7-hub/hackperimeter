import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { requiredEnv } from "./env";

export const RESUME_BUCKET = "resumes";

let adminClient: SupabaseClient | undefined;

/**
 * Service-role client. It bypasses row-level security, so only call it from
 * server code that has already decided the caller may do what it asks.
 */
export function supabaseAdmin(): SupabaseClient {
  adminClient ??= createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return adminClient;
}

/**
 * Client bound to the visitor's auth cookies. Used only for sign-in and to ask
 * who is signed in; the tables themselves are closed to it by RLS.
 */
export async function supabaseAuth(): Promise<SupabaseClient> {
  const store = await cookies();
  return createServerClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => {
          try {
            for (const { name, value, options } of list) store.set(name, value, options);
          } catch {
            // Server Components can't set cookies; proxy.ts refreshes the session instead.
          }
        },
      },
    },
  );
}

/** Supabase caps a select at 1,000 rows, so page through to get them all. */
export async function selectAll<T>(
  query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  pageSize = 1000,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await query(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) return rows;
  }
}
