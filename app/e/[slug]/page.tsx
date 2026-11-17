import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GuestUpload } from "@/components/guest-upload";
import { InviteRequired } from "@/components/invite-required";
import { groupByChapter, type AlbumPhoto } from "@/components/photo-grid";
import { SetupNotice } from "@/components/setup-notice";
import { albumAudience, findEventBySlug } from "@/lib/album-access";
import { readGuestId } from "@/lib/guest";
import { parseAlbumLook } from "@/lib/themes";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default function GuestEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<p className="px-5 py-8 animate-pulse text-sm font-semibold text-stone-800">Opening the album…</p>}>
      <GuestEvent params={params} />
    </Suspense>
  );
}

async function GuestEvent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  if (!supabase) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-5">
        <SetupNotice />
      </main>
    );
  }

  const data = await findEventBySlug(slug);

  if (!data) {
    notFound();
  }

  const { isHost, allowed } = await albumAudience(data);

  if (!allowed) {
    return <InviteRequired />;
  }

  const released = Boolean(data.is_released) || isHost;
  const theme = parseAlbumLook(data.scrapbook_theme);

  const { data: photoRows } = released
    ? await supabase
        .from("photos")
        .select("id, uploader_name, created_at, is_culled, cull_reason, chapter_title, ai_caption, analyzed_at, media_type, poster_path")
        .eq("event_id", data.id)
        .eq("is_culled", false)
        .not("analyzed_at", "is", null)
        .order("created_at", { ascending: true })
    : { data: [] };

  const keepers = ((photoRows ?? []) as AlbumPhoto[]).filter((photo) => !photo.is_culled);
  const guestId = await readGuestId();
  const admin = createAdminClient();
  let pickedIds: string[] = [];

  if (guestId && admin && released) {
    const { data: picks } = await admin
      .from("guest_picks")
      .select("photo_id")
      .eq("guest_id", guestId)
      .eq("event_id", data.id);
    pickedIds = (picks ?? []).map((pick) => pick.photo_id as string);
  }

  return (
    <GuestUpload
      event={{
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        eventDate: data.event_date,
        location: data.location,
        slug: data.slug,
      }}
      chapters={groupByChapter(keepers)}
      released={released}
      theme={theme}
      isHost={isHost}
      pickedIds={pickedIds}
    />
  );
}
