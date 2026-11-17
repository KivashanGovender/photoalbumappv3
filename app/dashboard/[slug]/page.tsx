import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { CurateButton } from "@/components/curate-button";
import { GalleryUpload } from "@/components/gallery-upload";
import { HowItWorks } from "@/components/how-it-works";
import { ChapterEditor, ReleaseToggle, ThemePicker } from "@/components/host-controls";
import { groupByChapter, PhotoGrid, type AlbumPhoto } from "@/components/photo-grid";
import { ShareEvent } from "@/components/share-event";
import { SetupNotice } from "@/components/setup-notice";
import { cardClass, secondaryButton } from "@/components/ui";
import { formatEventDate, type EventRecord } from "@/lib/events";
import { parseAlbumLook } from "@/lib/themes";
import { createClient } from "@/lib/supabase/server";

export default function EventDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<p className="animate-pulse text-sm font-semibold text-stone-800">Loading event…</p>}>
      <EventDashboard params={params} />
    </Suspense>
  );
}

async function EventDashboard({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  if (!supabase) {
    return <SetupNotice />;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error: eventExtrasError } = await supabase
    .from("events")
    .select("id, host_id, title, description, event_date, location, slug, is_public, created_at, is_released, scrapbook_theme")
    .eq("slug", slug)
    .eq("host_id", user.id)
    .maybeSingle();

  const event = (eventExtrasError ? null : data) as (EventRecord & { is_released?: boolean; scrapbook_theme?: string }) | null;
  const fallback = eventExtrasError
    ? ((
        await supabase
          .from("events")
          .select("id, host_id, title, description, event_date, location, slug, is_public, created_at")
          .eq("slug", slug)
          .eq("host_id", user.id)
          .maybeSingle()
      ).data as EventRecord | null)
    : event;

  const record = fallback;

  if (!record) {
    notFound();
  }

  const theme = parseAlbumLook(event?.scrapbook_theme);
  const released = Boolean(event?.is_released);

  const { data: photoRows, error: photosError } = await supabase
    .from("photos")
    .select("id, uploader_name, created_at, is_culled, cull_reason, chapter_title, ai_caption, analyzed_at, media_type, poster_path")
    .eq("event_id", record.id)
    .order("created_at", { ascending: true });

  const photos = (photoRows ?? []) as AlbumPhoto[];
  const waiting = photos.filter((photo) => !photo.analyzed_at);
  const culled = photos.filter((photo) => photo.analyzed_at && photo.is_culled);
  const keepers = photos.filter((photo) => photo.analyzed_at && !photo.is_culled);
  const chapters = groupByChapter(keepers);
  const eventDate = record.event_date ? formatEventDate(record.event_date) : null;

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/dashboard" className="text-sm font-semibold text-stone-800 underline">
            Back to events
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">{record.title}</h1>
        </div>
        <div className="grid justify-items-start gap-3">
          <HowItWorks />
          <CurateButton eventId={record.id} waiting={photosError ? 0 : waiting.length} />
        </div>
      </div>
      <section className={cardClass}>
        <h2 className="text-lg font-bold">Event Details</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-semibold text-stone-800">Date</dt>
            <dd className="mt-1 font-medium">{eventDate || "Not set"}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-stone-800">Location</dt>
            <dd className="mt-1 font-medium">{record.location || "Not set"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-semibold text-stone-800">Description</dt>
            <dd className="mt-1 whitespace-pre-wrap font-medium text-stone-800">
              {record.description || "No description"}
            </dd>
          </div>
        </dl>
      </section>
      <section className={cardClass}>
        <h2 className="text-lg font-bold">Guest Sharing</h2>
        <p className="text-sm font-medium leading-6 text-stone-800">
          Guests scan the code or open the link, then take photos. They see the album after you release it.
        </p>
        <ShareEvent slug={record.slug} title={record.title} />
      </section>
      <section className={cardClass}>
        <h2 className="text-lg font-bold">Release Album</h2>
        <ReleaseToggle slug={record.slug} released={released} />
        <ThemePicker slug={record.slug} theme={theme} />
        <Link href={`/e/${record.slug}/book`} className={`${secondaryButton} w-fit`}>
          Open the book view
        </Link>
      </section>
      {photosError ? (
        <p className="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm font-medium leading-6 text-amber-950">
          Add the curation columns on the photos table in Supabase, then reload this page.
        </p>
      ) : (
        <section className="grid gap-6">
          <div>
            <h2 className="text-lg font-bold">Master Photo Grid</h2>
            <GalleryUpload
              slug={record.slug}
              uploaderName="Host"
              host
              label="Upload media"
              className="inline-flex h-12 w-fit items-center justify-center rounded-full bg-stone-950 px-6 text-base font-bold text-white"
            />
            <p className="text-sm font-medium text-stone-800">
              Photos and videos uploaded here skip AI culling and go straight into the album.
            </p>
            <p className="mt-1 text-sm font-medium text-stone-800">
              {photos.length} photos · {waiting.length} waiting · {keepers.length} in the album · {culled.length} hidden
            </p>
          </div>
          {chapters.map(([chapter, chapterPhotos]) => (
            <section key={chapter} className="grid gap-3">
              <ChapterEditor slug={record.slug} title={chapter} />
              <PhotoGrid
                photos={chapterPhotos}
                eventTitle={record.title}
                eventDate={eventDate}
                slug={record.slug}
                host
                theme={theme}
              />
            </section>
          ))}
          {waiting.length > 0 ? (
            <section className="grid gap-3">
              <h3 className="text-lg font-bold">Waiting for curation</h3>
              <PhotoGrid photos={waiting} eventTitle={record.title} eventDate={eventDate} slug={record.slug} host />
            </section>
          ) : null}
          {culled.length > 0 ? (
            <section className="grid gap-3">
              <h3 className="text-lg font-bold">Hidden</h3>
              <PhotoGrid photos={culled} eventTitle={record.title} eventDate={eventDate} slug={record.slug} host />
            </section>
          ) : null}
        </section>
      )}
    </section>
  );
}
