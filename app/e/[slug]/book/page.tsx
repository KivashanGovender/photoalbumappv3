import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BookAlbum } from "@/components/book-album";
import { InviteRequired } from "@/components/invite-required";
import { groupByChapter, type AlbumPhoto } from "@/components/photo-grid";
import { albumAudience, findEventBySlug } from "@/lib/album-access";
import { formatEventDate } from "@/lib/events";
import { parseAlbumLook } from "@/lib/themes";
import { createClient } from "@/lib/supabase/server";

export default function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<p className="px-5 py-8 animate-pulse text-sm font-semibold text-stone-800">Opening the book…</p>}>
      <Book params={params} />
    </Suspense>
  );
}

async function Book({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  if (!supabase) {
    notFound();
  }

  const event = await findEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const access = await albumAudience(event);

  if (!access.allowed) {
    return <InviteRequired />;
  }

  const allowed = Boolean(event.is_released) || access.isHost;

  const { data: photoRows } = allowed
    ? await supabase
        .from("photos")
        .select("id, uploader_name, created_at, is_culled, cull_reason, chapter_title, ai_caption, analyzed_at, media_type, poster_path")
        .eq("event_id", event.id)
        .eq("is_culled", false)
        .not("analyzed_at", "is", null)
        .order("created_at", { ascending: true })
    : { data: [] };

  const chapters = groupByChapter((photoRows ?? []) as AlbumPhoto[]);
  const theme = parseAlbumLook(event.scrapbook_theme);
  const eventDate = event.event_date ? formatEventDate(event.event_date) : null;

  return (
    <BookAlbum
      title={event.title}
      slug={event.slug}
      eventDate={eventDate}
      chapters={chapters}
      theme={theme}
      isHost={access.isHost}
      locked={!allowed}
    />
  );
}
