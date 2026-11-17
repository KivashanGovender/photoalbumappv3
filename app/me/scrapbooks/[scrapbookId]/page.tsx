import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ScrapbookEditor, type ScrapbookPageItem } from "@/components/scrapbook-editor";
import { formatEventDate } from "@/lib/events";
import { readGuestId } from "@/lib/guest";
import { parseTheme } from "@/lib/themes";
import { createAdminClient } from "@/lib/supabase/admin";

export default function ScrapbookPage({ params }: { params: Promise<{ scrapbookId: string }> }) {
  return (
    <Suspense fallback={<p className="px-5 py-8 animate-pulse text-sm font-semibold text-stone-800">Opening the scrapbook…</p>}>
      <Scrapbook params={params} />
    </Suspense>
  );
}

async function Scrapbook({ params }: { params: Promise<{ scrapbookId: string }> }) {
  const { scrapbookId } = await params;
  const guestId = await readGuestId();
  const admin = createAdminClient();

  if (!guestId || !admin) {
    notFound();
  }

  const { data: scrapbook } = await admin
    .from("scrapbooks")
    .select("id, title, theme, event_id, events(title, event_date)")
    .eq("id", scrapbookId)
    .eq("guest_id", guestId)
    .maybeSingle();

  if (!scrapbook) {
    notFound();
  }

  const { data: items } = await admin
    .from("scrapbook_items")
    .select("id, photo_id, caption, chapter_title, position, photos(uploader_name)")
    .eq("scrapbook_id", scrapbookId)
    .order("position", { ascending: true });

  const event = Array.isArray(scrapbook.events) ? scrapbook.events[0] : scrapbook.events;
  const pages: ScrapbookPageItem[] = (items ?? []).map((item) => {
    const photo = Array.isArray(item.photos) ? item.photos[0] : item.photos;
    return {
      id: item.id as string,
      photoId: item.photo_id as string,
      caption: (item.caption as string | null) || "",
      chapter: (item.chapter_title as string | null) || "Album",
      uploaderName: (photo?.uploader_name as string | null) || "A guest",
    };
  });

  return (
    <ScrapbookEditor
      scrapbookId={scrapbook.id as string}
      title={scrapbook.title as string}
      eventTitle={(event?.title as string | undefined) || "Event"}
      eventDate={event?.event_date ? formatEventDate(event.event_date as string) : null}
      theme={parseTheme(scrapbook.theme as string)}
      items={pages}
    />
  );
}
