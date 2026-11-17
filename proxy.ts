import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { fetchWithTimeout } from "@/lib/fetch-timeout";
import { getSupabaseEnv } from "@/lib/supabase/env";

const GUEST_COOKIE = "eventalbum_guest";
const GUEST_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function requestWithGuest(request: NextRequest) {
  const headers = new Headers(request.headers);
  const value = request.cookies.get(GUEST_COOKIE)?.value;
  const guestId = value && GUEST_ID.test(value) ? value : null;

  if (guestId) {
    headers.set("x-guest-id", guestId);
  }

  return { headers };
}

export async function proxy(request: NextRequest) {
  const env = getSupabaseEnv();

  if (!env) {
    return NextResponse.next({ request: requestWithGuest(request) });
  }

  let supabaseResponse = NextResponse.next({ request: requestWithGuest(request) });

  const supabase = createServerClient(env.url, env.key, {
    global: { fetch: fetchWithTimeout },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request: requestWithGuest(request) });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  let user: { id: string } | null = null;

  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    user = null;
  }

  const { pathname } = request.nextUrl;

  if (!user && pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return withSessionCookies(supabaseResponse, NextResponse.redirect(url));
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return withSessionCookies(supabaseResponse, NextResponse.redirect(url));
  }

  return supabaseResponse;
}

function withSessionCookies(source: NextResponse, response: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
