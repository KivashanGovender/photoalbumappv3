import { readGuestId, writeGuestId } from "@/lib/guest";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type AlbumRecord = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  event_date: string | null;
  location: string | null;
  slug: string;
  is_public: boolean;
  is_released: boolean;
  scrapbook_theme: string | null;
  host_id: string;
};

const EVENT_COLUMNS =
  "id, title, subtitle, description, event_date, location, slug, is_public, is_released, scrapbook_theme, host_id";

export async function findEventBySlug(slug: string) {
  if (!SLUG.test(slug)) {
    return null;
  }

  const admin = createAdminClient();
  const supabase = admin ?? (await createClient());

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.from("events").select(EVENT_COLUMNS).eq("slug", slug).maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as AlbumRecord;
}

export async function guestBelongsToEvent(eventId: string, guestId: string | null) {
  if (!guestId) {
    return false;
  }

  const admin = createAdminClient();

  if (!admin) {
    return false;
  }

  const { data } = await admin
    .from("event_guests")
    .select("guest_id")
    .eq("event_id", eventId)
    .eq("guest_id", guestId)
    .maybeSingle();

  return Boolean(data);
}

export async function albumAudience(event: Pick<AlbumRecord, "id" | "host_id" | "is_public">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const isHost = Boolean(user && user.id === event.host_id);
  const guestId = await readGuestId();
  const invited = isHost ? false : await guestBelongsToEvent(event.id, guestId);

  return {
    isHost,
    invited,
    allowed: isHost || event.is_public || invited,
  };
}

export async function registerInvitedGuest(eventId: string) {
  const admin = createAdminClient();

  if (!admin) {
    return false;
  }

  const existingId = await readGuestId();

  if (existingId) {
    const { error } = await admin
      .from("event_guests")
      .upsert({ guest_id: existingId, event_id: eventId }, { onConflict: "guest_id,event_id" });

    if (!error) {
      return true;
    }
  }

  const { data: guest, error } = await admin.from("guests").insert({ first_name: "Guest" }).select("id").single();

  if (error || !guest) {
    return false;
  }

  await writeGuestId(guest.id as string);

  const { error: membershipError } = await admin
    .from("event_guests")
    .upsert({ guest_id: guest.id, event_id: eventId }, { onConflict: "guest_id,event_id" });

  return !membershipError;
}
