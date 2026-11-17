import { createServerClient } from "@supabase/ssr";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { fetchWithTimeout } from "@/lib/fetch-timeout";
import { readGuestId } from "@/lib/guest";
import { getSupabaseEnv } from "@/lib/supabase/env";

export async function createClient() {
  // Supabase Auth reads Date.now() while checking the session. Cache Components
  // rejects that during prerender, so wait for the real request first.
  await connection();

  const env = getSupabaseEnv();

  if (!env) {
    return null;
  }

  const cookieStore = await cookies();
  const guestId = await readGuestId();

  return createServerClient(env.url, env.key, {
    global: {
      fetch: fetchWithTimeout,
      headers: guestId ? { "x-guest-id": guestId } : {},
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. The proxy refreshes the session.
        }
      },
    },
  });
}
