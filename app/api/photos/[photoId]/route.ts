import { guestBelongsToEvent } from "@/lib/album-access";
import { readGuestId } from "@/lib/guest";
import { readFromR2 } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";

const PHOTO_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ photoId: string }> },
) {
  const { photoId } = await params;

  if (!PHOTO_ID.test(photoId)) {
    return new Response("That photo was not found.", { status: 404 });
  }

  const supabase = await createClient();

  if (!supabase) {
    return new Response("Supabase is not configured.", { status: 503 });
  }

  const { data: photo } = await supabase
    .from("photos")
    .select("storage_path, is_culled, event_id")
    .eq("id", photoId)
    .maybeSingle();

  if (!photo) {
    return new Response("That photo was not found.", { status: 404 });
  }

  const { data: event } = await supabase
    .from("events")
    .select("host_id, is_public")
    .eq("id", photo.event_id)
    .maybeSingle();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isHost = Boolean(user && event && event.host_id === user.id);
  const invited = Boolean(event && !isHost && (await guestBelongsToEvent(photo.event_id, await readGuestId())));

  if (!event || (!event.is_public && !isHost && !invited) || (photo.is_culled && !isHost)) {
    return new Response("That photo was not found.", { status: 404 });
  }

  try {
    const file = await readFromR2(photo.storage_path);
    return new Response(Buffer.from(file.bytes), {
      headers: {
        "Content-Type": file.contentType,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return new Response("The photo could not be loaded.", { status: 404 });
  }
}
