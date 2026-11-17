import AlbumViewer from "@/app/components/scrapbook/AlbumViewer";
import { RestoreButton } from "@/components/restore-button";
import { StoryDownload } from "@/components/story-download";
import { CaptionEditor, ChapterEditor, HideButton } from "@/components/host-controls";
import { PickButton } from "@/components/guest-controls";
import { TileMarks } from "@/components/theme-marks";
import { formatPhotoTime } from "@/lib/events";
import { THEMES, isAlbumTemplate, themeStyle, type ScrapbookTheme } from "@/lib/themes";

export type AlbumPhoto = {
  id: string;
  uploader_name: string | null;
  created_at: string;
  is_culled: boolean;
  cull_reason: string | null;
  chapter_title: string | null;
  ai_caption: string | null;
  analyzed_at: string | null;
  media_type: "image" | "video" | null;
  poster_path: string | null;
};

export function groupByChapter(photos: AlbumPhoto[]) {
  const groups: Array<[string, AlbumPhoto[]]> = [];

  for (const photo of photos) {
    const title = photo.chapter_title || "Album";
    const current = groups.find(([name]) => name === title);
    if (current) {
      current[1].push(photo);
    } else {
      groups.push([title, [photo]]);
    }
  }

  return groups;
}

export function PhotoGrid({
  photos,
  eventTitle,
  eventDate,
  slug,
  host,
  theme = "editorial",
  themeId,
  pickedIds = [],
}: {
  photos: AlbumPhoto[];
  eventTitle: string;
  eventDate?: string | null;
  slug?: string;
  host?: boolean;
  theme?: ScrapbookTheme | string;
  themeId?: string;
  pickedIds?: string[];
}) {
  const activeTemplate = [themeId, theme].find(isAlbumTemplate);

  if (activeTemplate) {
    return (
      <AlbumViewer
        templateId={activeTemplate}
        title={eventTitle}
        subtitle={eventDate ?? undefined}
        photos={photos.map((photo) => ({
          id: photo.id,
          ai_caption: photo.ai_caption ?? undefined,
          media_type: photo.media_type ?? "image",
          poster_path: photo.poster_path,
        }))}
      />
    );
  }

  const legacyTheme = (THEMES as readonly string[]).includes(theme) ? (theme as ScrapbookTheme) : "editorial";
  const style = themeStyle(legacyTheme);
  const groups = style.strips ? chunk(photos, 3) : [photos];

  return (
    <div className={style.canvas}>
      {groups.map((group, groupIndex) => (
        <ul key={group[0]?.id ?? groupIndex} className={style.grid}>
          {group.map((photo, index) => (
            <PhotoTile
              key={photo.id}
              photo={photo}
              eventTitle={eventTitle}
              eventDate={eventDate}
              slug={slug}
              host={host}
              theme={legacyTheme}
              index={groupIndex * 3 + index}
              picked={pickedIds.includes(photo.id)}
            />
          ))}
        </ul>
      ))}
    </div>
  );
}

function chunk<T>(items: T[], size: number) {
  const groups: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }

  return groups;
}

function PhotoTile({
  photo,
  eventTitle,
  eventDate,
  slug,
  host,
  theme,
  index,
  picked,
}: {
  photo: AlbumPhoto;
  eventTitle: string;
  eventDate?: string | null;
  slug?: string;
  host?: boolean;
  theme: ScrapbookTheme;
  index: number;
  picked: boolean;
}) {
  const style = themeStyle(theme);
  const hidden = Boolean(photo.analyzed_at && photo.is_culled);
  const keeper = Boolean(photo.analyzed_at && !photo.is_culled);
  const uploader = photo.uploader_name || "A guest";
  const tilt = [-1.8, 1.4, -0.6][index % 3];

  return (
    <li className={style.tile} style={style.tilt ? { transform: `rotate(${tilt}deg)` } : undefined}>
      <div className={`relative aspect-[4/5] overflow-hidden bg-stone-200 ${theme === "y2k" ? "border-x-8 border-black" : ""}`}>
        <TileMarks theme={theme} />
        {/* Same-origin photo route. The optimizer would drop the host session cookie. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/photos/${photo.id}`}
          alt={photo.ai_caption || `Photo by ${uploader}`}
          crossOrigin="anonymous"
          className={`h-full w-full object-cover ${hidden ? "opacity-45" : ""}`}
        />
        {hidden ? (
          <span className="absolute top-3 left-3 rounded-full bg-stone-950 px-3 py-1 text-xs font-bold text-white">
            Hidden
          </span>
        ) : null}
      </div>
      <div className="grid gap-3 p-4" style={{ fontFamily: style.fontFamily }}>
        <p className={style.byline}>
          {uploader} · {formatPhotoTime(photo.created_at)}
        </p>
        {keeper && host && slug ? (
          <CaptionEditor slug={slug} photoId={photo.id} caption={photo.ai_caption || ""} />
        ) : null}
        {keeper && !host ? <p className={style.caption}>{photo.ai_caption}</p> : null}
        {hidden ? (
          <p className="text-sm text-stone-700">Hidden · {photo.cull_reason || "Culled"}</p>
        ) : null}
        {!photo.analyzed_at ? <p className="text-sm font-semibold text-stone-800">Not curated yet</p> : null}
        {keeper ? (
          <StoryDownload
            photoId={photo.id}
            eventTitle={eventTitle}
            eventDate={eventDate}
            caption={photo.ai_caption}
            uploaderName={uploader}
            theme={theme}
          />
        ) : null}
        {host && keeper && slug ? <HideButton slug={slug} photoId={photo.id} /> : null}
        {host && hidden && slug ? <RestoreButton photoId={photo.id} slug={slug} /> : null}
        {!host && keeper && slug ? <PickButton slug={slug} photoId={photo.id} picked={picked} /> : null}
      </div>
    </li>
  );
}
