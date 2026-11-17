"use server";

import { revalidatePath } from "next/cache";
import { guestBelongsToEvent } from "@/lib/album-access";
import { readGuestId } from "@/lib/guest";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteFromR2, isR2Configured, uploadToR2 } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";

export type UploadPhotoState = {
  error?: string;
  ok?: boolean;
};

const MAX_BYTES = 4 * 1024 * 1024;
const VIDEO_MAX_BYTES = 50 * 1024 * 1024;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PHOTO_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NAME_PATTERN = /^[\p{L}][\p{L}\s'.-]{0,39}$/u;

const IMAGE_TYPES: Record<string, { extension: string; matches: (bytes: Uint8Array) => boolean }> =
  {
    "image/jpeg": {
      extension: "jpg",
      matches: (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
    },
    "image/png": {
      extension: "png",
      matches: (bytes) =>
        bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47,
    },
    "image/webp": {
      extension: "webp",
      matches: (bytes) =>
        bytes[0] === 0x52 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x46 &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50,
    },
  };

export async function uploadGuestPhoto(formData: FormData): Promise<UploadPhotoState> {
  return saveEventPhoto(formData, { approved: false, host: false });
}

export async function uploadApprovedPhoto(formData: FormData): Promise<UploadPhotoState> {
  return saveEventPhoto(formData, { approved: true, host: formData.get("asHost") === "1" });
}

async function saveEventPhoto(
  formData: FormData,
  options: { approved: boolean; host: boolean },
): Promise<UploadPhotoState> {
  const slug = String(formData.get("slug") ?? "");
  const uploaderName = String(formData.get("uploaderName") ?? "")
    .replace(/[\u0000-\u001f]/g, "")
    .trim()
    .replace(/\s+/g, " ");
  const photo = formData.get("photo");

  if (!SLUG_PATTERN.test(slug)) {
    return { error: "This event link is not valid." };
  }

  if (!NAME_PATTERN.test(uploaderName)) {
    return { error: "Enter a first name using letters, spaces, hyphens, or apostrophes." };
  }

  if (!(photo instanceof File)) {
    return { error: options.approved ? "Choose a photo to upload." : "Take a photo before uploading." };
  }

  if (photo.size <= 0) {
    return { error: "That file is empty." };
  }

  const videoExtension = videoFileExtension(photo);
  const imageType = videoExtension ? undefined : IMAGE_TYPES[photo.type];

  if (!videoExtension && !imageType) {
    return { error: "Use a JPEG, PNG, or WebP photo, or an MP4 or MOV video." };
  }

  if (videoExtension && photo.size > VIDEO_MAX_BYTES) {
    return { error: "Video must be under 50MB" };
  }

  if (!videoExtension && photo.size > MAX_BYTES) {
    return { error: "Each photo must be under 4 MB." };
  }

  const bytes = new Uint8Array(await photo.arrayBuffer());

  if (videoExtension) {
    if (!isIsoVideo(bytes)) {
      return { error: "That file is not a valid MP4 or MOV video." };
    }
  } else if (!imageType || bytes.length < 12 || !imageType.matches(bytes)) {
    return { error: "That file is not a valid photo." };
  }

  if (!isR2Configured()) {
    return {
      error:
        "Add the Cloudflare R2 settings to .env.local, then restart the dev server.",
    };
  }

  const admin = createAdminClient();

  if (!admin) {
    return {
      error:
        "Add SUPABASE_SERVICE_ROLE_KEY to .env.local, then restart the dev server.",
    };
  }

  const { data: event, error: eventError } = await admin
    .from("events")
    .select("id, host_id, is_public")
    .eq("slug", slug)
    .maybeSingle();

  if (eventError) {
    return { error: "The album could not be opened. Try again." };
  }

  if (!event) {
    return { error: "This album is not accepting photos." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const isHost = Boolean(user && user.id === event.host_id);

  if (options.host && !isHost) {
    return { error: "Sign in as the host to upload photos." };
  }

  if (!isHost && !event.is_public) {
    const invited = await guestBelongsToEvent(event.id, await readGuestId());

    if (!invited) {
      return { error: "Invite required." };
    }
  }

  const extension = videoExtension ?? imageType?.extension ?? "jpg";
  const storagePath = `events/${event.id}/${crypto.randomUUID()}.${extension}`;
  const contentType = videoExtension ? videoContentType(videoExtension) : photo.type;

  try {
    await uploadToR2(storagePath, Buffer.from(bytes), contentType);
  } catch {
    return { error: videoExtension ? "The video could not be stored. Try again." : "The photo could not be stored. Try again." };
  }

  const photoRow = {
    event_id: event.id,
    storage_path: storagePath,
    uploader_name: uploaderName,
    media_type: videoExtension ? "video" : "image",
    poster_path: null,
    ...(options.approved || videoExtension
      ? {
          is_culled: false,
          cull_reason: null,
          analyzed_at: new Date().toISOString(),
          chapter_title: "Album",
        }
      : {}),
  };
  // The request client carries x-guest-id, so a guest insert can pass RLS.
  // The service role is only a fallback when that policy is not installed yet.
  const guestInsert = supabase ? await supabase.from("photos").insert(photoRow) : null;
  const insertError =
    !guestInsert || isRlsError(guestInsert.error?.message)
      ? (await admin.from("photos").insert(photoRow)).error
      : guestInsert.error;

  if (insertError) {
    await deleteFromR2(storagePath).catch(() => undefined);
    if (/media_type|poster_path/.test(insertError.message)) {
      return { error: "Run supabase/add-video-support.sql in the Supabase SQL editor, then try the upload again." };
    }
    return { error: "The album could not save this file. Try again." };
  }

  revalidatePath(`/e/${slug}`);
  revalidatePath(`/e/${slug}/book`);
  revalidatePath(`/dashboard/${slug}`);
  return { ok: true };
}

export async function restorePhoto(photoId: string, slug: string) {
  if (!PHOTO_ID.test(photoId) || !SLUG_PATTERN.test(slug)) {
    return { error: "That photo could not be restored." };
  }

  const supabase = await createClient();

  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in as the host to restore a photo." };
  }

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("slug", slug)
    .eq("host_id", user.id)
    .maybeSingle();

  if (!event) {
    return { error: "That event was not found." };
  }

  const { error } = await supabase
    .from("photos")
    .update({ is_culled: false, cull_reason: null })
    .eq("id", photoId)
    .eq("event_id", event.id);

  if (error) {
    return { error: "The photo could not be restored." };
  }

  revalidatePath(`/dashboard/${slug}`);
  revalidatePath(`/e/${slug}`);
  return { ok: true };
}

function isRlsError(message: string | undefined) {
  return Boolean(message && /row-level security|permission denied/i.test(message));
}

function videoFileExtension(file: File) {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  if (type.startsWith("image/")) {
    return null;
  }

  if (type === "video/mp4" || name.endsWith(".mp4")) {
    return "mp4";
  }

  if (type === "video/quicktime" || type === "video/mov" || name.endsWith(".mov")) {
    return "mov";
  }

  return null;
}

function videoContentType(extension: string) {
  return extension === "mov" ? "video/quicktime" : "video/mp4";
}

function isIsoVideo(bytes: Uint8Array) {
  return (
    bytes.length >= 12 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  );
}
