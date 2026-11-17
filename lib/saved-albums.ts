import { readGuestId } from "@/lib/guest";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type SavedAlbum = {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  eventDate: string | null;
  location: string | null;
  role: "host" | "guest";
};

type AlbumRow = {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  event_date: string | null;
  location: string | null;
};

function toAlbum(row: AlbumRow, role: SavedAlbum["role"]): SavedAlbum {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    slug: row.slug,
    eventDate: row.event_date,
    location: row.location,
    role,
  };
}

export async function findSavedAlbums() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const albums = new Map<string, SavedAlbum>();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from("events")
        .select("id, title, subtitle, slug, event_date, location, created_at")
        .eq("host_id", user.id)
        .order("created_at", { ascending: false });

      for (const row of (data ?? []) as AlbumRow[]) {
        albums.set(row.id, toAlbum(row, "host"));
      }
    }
  }

  const guestId = await readGuestId();

  if (guestId && admin) {
    const { data: memberships } = await admin.from("event_guests").select("event_id").eq("guest_id", guestId);
    const ids = (memberships ?? []).map((membership) => membership.event_id as string).filter((id) => !albums.has(id));

    if (ids.length > 0) {
      const { data } = await admin
        .from("events")
        .select("id, title, subtitle, slug, event_date, location")
        .in("id", ids);

      for (const row of (data ?? []) as AlbumRow[]) {
        albums.set(row.id, toAlbum(row, "guest"));
      }
    }
  }

  return [...albums.values()];
}
