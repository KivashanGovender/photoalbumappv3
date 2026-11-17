import { connection } from "next/server";
import { cookies, headers } from "next/headers";

export const GUEST_COOKIE = "eventalbum_guest";

const GUEST_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function guestIdFromValue(value: string | undefined) {
  return value && GUEST_ID.test(value) ? value : null;
}

export async function readGuestId() {
  await connection();
  const cookieStore = await cookies();
  const fromCookie = guestIdFromValue(cookieStore.get(GUEST_COOKIE)?.value);

  if (fromCookie) {
    return fromCookie;
  }

  // Proxy copies the guest cookie onto this header before the action runs.
  const headerStore = await headers();
  return guestIdFromValue(headerStore.get("x-guest-id") ?? undefined);
}

export async function writeGuestId(guestId: string) {
  const cookieStore = await cookies();
  cookieStore.set(GUEST_COOKIE, guestId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
