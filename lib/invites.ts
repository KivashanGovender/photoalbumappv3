import { createHmac, timingSafeEqual } from "crypto";

function inviteSecret() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

export function createInviteToken(eventId: string) {
  const secret = inviteSecret();

  if (!secret) {
    return null;
  }

  return createHmac("sha256", secret).update(eventId).digest("base64url");
}

export function inviteTokenMatches(eventId: string, token: string) {
  const expected = createInviteToken(eventId);

  if (!expected || !token) {
    return false;
  }

  const known = Buffer.from(expected);
  const received = Buffer.from(token);

  if (known.length !== received.length) {
    return false;
  }

  return timingSafeEqual(known, received);
}
