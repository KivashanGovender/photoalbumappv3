"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createInviteToken } from "@/lib/invites";
import { findEventBySlug, guestBelongsToEvent } from "@/lib/album-access";
import { readGuestId, writeGuestId } from "@/lib/guest";
import { draftPersonalScrapbook } from "@/lib/scrapbook";
import { isAlbumTemplate, parseTheme, type AlbumLook, type ScrapbookTheme } from "@/lib/themes";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NAME = /^[\p{L}][\p{L}\s'.-]{0,39}$/u;

async function hostEvent(slug: string) {
  if (!SLUG.test(slug)) {
    return { error: "That event was not found." as const };
  }

  const supabase = await createClient();

  if (!supabase) {
    return { error: "Supabase is not configured." as const };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in as the host to edit this album." as const };
  }

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("slug", slug)
    .eq("host_id", user.id)
    .maybeSingle();

  if (!event) {
    return { error: "That event was not found." as const };
  }

  return { supabase, eventId: event.id as string };
}

function refresh(slug: string) {
  revalidatePath(`/dashboard/${slug}`);
  revalidatePath(`/e/${slug}`);
  revalidatePath(`/e/${slug}/book`);
}

export async function updateCaption(slug: string, photoId: string, caption: string) {
  const host = await hostEvent(slug);

  if ("error" in host) {
    return host;
  }

  if (!ID.test(photoId)) {
    return { error: "That photo was not found." };
  }

  const next = caption.replace(/\s+/g, " ").trim().slice(0, 400);

  if (!next) {
    return { error: "Enter a caption." };
  }

  const { error } = await host.supabase
    .from("photos")
    .update({ ai_caption: next })
    .eq("id", photoId)
    .eq("event_id", host.eventId);

  if (error) {
    return { error: "The caption could not be saved." };
  }

  refresh(slug);
  return { ok: true };
}

export async function renameChapter(slug: string, from: string, to: string) {
  const host = await hostEvent(slug);

  if ("error" in host) {
    return host;
  }

  const next = to.replace(/\s+/g, " ").trim().slice(0, 80);

  if (!next) {
    return { error: "Enter a chapter title." };
  }

  const { error } = await host.supabase
    .from("photos")
    .update({ chapter_title: next })
    .eq("event_id", host.eventId)
    .eq("chapter_title", from);

  if (error) {
    return { error: "The chapter could not be renamed." };
  }

  refresh(slug);
  return { ok: true };
}

export async function setPhotoHidden(slug: string, photoId: string, hidden: boolean) {
  const host = await hostEvent(slug);

  if ("error" in host) {
    return host;
  }

  if (!ID.test(photoId)) {
    return { error: "That photo was not found." };
  }

  const { error } = await host.supabase
    .from("photos")
    .update({
      is_culled: hidden,
      cull_reason: hidden ? "Hidden by the host" : null,
      analyzed_at: new Date().toISOString(),
    })
    .eq("id", photoId)
    .eq("event_id", host.eventId);

  if (error) {
    return { error: hidden ? "The photo could not be hidden." : "The photo could not be restored." };
  }

  refresh(slug);
  return { ok: true };
}

export async function setAlbumTheme(slug: string, theme: AlbumLook) {
  const host = await hostEvent(slug);

  if ("error" in host) {
    return host;
  }

  const { error } = await host.supabase
    .from("events")
    .update({ scrapbook_theme: isAlbumTemplate(theme) ? theme : parseTheme(theme) })
    .eq("id", host.eventId);

  if (error) {
    return { error: "Run the album social SQL in Supabase, then try the theme again." };
  }

  refresh(slug);
  return { ok: true };
}

export async function setAlbumReleased(slug: string, released: boolean) {
  const host = await hostEvent(slug);

  if ("error" in host) {
    return host;
  }

  const { error } = await host.supabase.from("events").update({ is_released: released }).eq("id", host.eventId);

  if (error) {
    return { error: "Run the album social SQL in Supabase, then try the release again." };
  }

  refresh(slug);
  return { ok: true };
}

export async function saveAlbum(
  slug: string,
  input: { title: string; subtitle: string; theme: AlbumLook },
) {
  const host = await hostEvent(slug);

  if ("error" in host) {
    return host;
  }

  const title = input.title.trim().replace(/\s+/g, " ");
  const subtitle = input.subtitle.trim().replace(/\s+/g, " ");

  if (!title || title.length > 120) {
    return { error: "Add a title of 120 characters or fewer." };
  }

  if (subtitle.length > 160) {
    return { error: "Keep the subtitle under 160 characters." };
  }

  const theme = isAlbumTemplate(input.theme) ? input.theme : parseTheme(input.theme);
  const { error } = await host.supabase
    .from("events")
    .update({
      title,
      subtitle: subtitle || null,
      scrapbook_theme: theme,
    })
    .eq("id", host.eventId);

  if (error) {
    return { error: "The album could not be saved." };
  }

  refresh(slug);
  return { ok: true };
}

export async function inviteLink(slug: string) {
  const host = await hostEvent(slug);

  if ("error" in host) {
    return { error: host.error };
  }

  const token = createInviteToken(host.eventId);

  if (!token) {
    return { error: "Invites are not configured." };
  }

  return { path: `/e/${slug}/invite/${token}` };
}

export async function joinEvent(slug: string, firstName: string) {
  const name = firstName.trim().replace(/\s+/g, " ");

  if (!SLUG.test(slug) || !NAME.test(name)) {
    return { error: "Enter a first name to keep this event." };
  }

  const admin = createAdminClient();
  const supabase = await createClient();

  if (!admin || !supabase) {
    return { error: "Supabase is not configured." };
  }

  const event = await findEventBySlug(slug);

  if (!event) {
    return { error: "That event was not found." };
  }

  const guestIdForAccess = await readGuestId();
  const invited = await guestBelongsToEvent(event.id, guestIdForAccess);

  if (!event.is_public && !invited) {
    return { error: "Invite required." };
  }

  const existingId = await readGuestId();
  let guestId = existingId;

  if (guestId) {
    await admin.from("guests").update({ first_name: name }).eq("id", guestId);
  } else {
    const { data: guest, error } = await admin.from("guests").insert({ first_name: name }).select("id").single();

    if (error || !guest) {
      return { error: "Run the album social SQL in Supabase, then enter your name again." };
    }

    guestId = guest.id as string;
    await writeGuestId(guestId);
  }

  const { error: membershipError } = await admin
    .from("event_guests")
    .upsert({ guest_id: guestId, event_id: event.id }, { onConflict: "guest_id,event_id" });

  if (membershipError) {
    return { error: "This event could not be saved to My Events." };
  }

  revalidatePath("/me");
  return { ok: true };
}

export async function togglePick(slug: string, photoId: string) {
  if (!SLUG.test(slug) || !ID.test(photoId)) {
    return { error: "That photo could not be saved." };
  }

  const guestId = await readGuestId();
  const admin = createAdminClient();
  const supabase = await createClient();

  if (!guestId || !admin || !supabase) {
    return { error: "Enter your name before saving photos." };
  }

  const event = await findEventBySlug(slug);
  const invited = await guestBelongsToEvent(event?.id ?? "", guestId);

  if (!event || (!event.is_public && !invited)) {
    return { error: "Invite required." };
  }

  if (!event.is_released) {
    return { error: "The host has not released this album yet." };
  }

  const { data: existing } = await admin
    .from("guest_picks")
    .select("photo_id")
    .eq("guest_id", guestId)
    .eq("photo_id", photoId)
    .maybeSingle();

  if (existing) {
    await admin.from("guest_picks").delete().eq("guest_id", guestId).eq("photo_id", photoId);
  } else {
    const { error } = await admin.from("guest_picks").insert({
      guest_id: guestId,
      photo_id: photoId,
      event_id: event.id,
    });

    if (error) {
      return { error: "That photo could not be saved." };
    }
  }

  revalidatePath(`/e/${slug}`);
  return { ok: true };
}

export async function createPersonalScrapbook(slug: string) {
  if (!SLUG.test(slug)) {
    return { error: "That event was not found." };
  }

  const guestId = await readGuestId();
  const admin = createAdminClient();
  const supabase = await createClient();

  if (!guestId || !admin || !supabase) {
    return { error: "Enter your name before creating a scrapbook." };
  }

  const { data: guest } = await admin.from("guests").select("first_name").eq("id", guestId).maybeSingle();
  const event = await findEventBySlug(slug);
  const invited = await guestBelongsToEvent(event?.id ?? "", guestId);

  if (!guest || !event || (!event.is_public && !invited)) {
    return { error: "Invite required." };
  }

  if (!event.is_released) {
    return { error: "The host has not released this album yet." };
  }

  const { data: picks } = await admin
    .from("guest_picks")
    .select("photo_id")
    .eq("guest_id", guestId)
    .eq("event_id", event.id);

  const ids = (picks ?? []).map((pick) => pick.photo_id as string);

  if (ids.length === 0) {
    return { error: "Select a few photos first." };
  }

  const { data: photos } = await supabase
    .from("photos")
    .select("id, uploader_name, created_at, chapter_title, ai_caption, is_culled, media_type, poster_path")
    .in("id", ids)
    .eq("event_id", event.id)
    .eq("is_culled", false);

  const sources = photos ?? [];

  if (sources.length === 0) {
    return { error: "Those photos are no longer in the album." };
  }

  let draft;

  try {
    draft = await draftPersonalScrapbook(guest.first_name as string, event.title as string, sources);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "The scrapbook could not be created." };
  }

  const { data: scrapbook, error } = await admin
    .from("scrapbooks")
    .insert({
      guest_id: guestId,
      event_id: event.id,
      title: draft.title,
      theme: draft.theme,
    })
    .select("id")
    .single();

  if (error || !scrapbook) {
    return { error: "The scrapbook could not be saved." };
  }

  const { error: itemError } = await admin.from("scrapbook_items").insert(
    draft.pages.map((page, index) => ({
      scrapbook_id: scrapbook.id,
      photo_id: page.photoId,
      position: index,
      chapter_title: page.chapterTitle,
      caption: page.caption,
    })),
  );

  if (itemError) {
    return { error: "The scrapbook pages could not be saved." };
  }

  redirect(`/me/scrapbooks/${scrapbook.id}`);
}

export async function updateScrapbookItem(
  scrapbookId: string,
  itemId: string,
  fields: { caption?: string; chapter?: string },
) {
  const guestId = await readGuestId();
  const admin = createAdminClient();

  if (!guestId || !admin || !ID.test(scrapbookId) || !ID.test(itemId)) {
    return { error: "That page could not be edited." };
  }

  const { data: scrapbook } = await admin
    .from("scrapbooks")
    .select("id")
    .eq("id", scrapbookId)
    .eq("guest_id", guestId)
    .maybeSingle();

  if (!scrapbook) {
    return { error: "That scrapbook was not found." };
  }

  const update: { caption?: string; chapter_title?: string } = {};

  if (fields.caption !== undefined) {
    update.caption = fields.caption.replace(/\s+/g, " ").trim().slice(0, 400);
  }

  if (fields.chapter !== undefined) {
    update.chapter_title = fields.chapter.replace(/\s+/g, " ").trim().slice(0, 80);
  }

  const { error } = await admin.from("scrapbook_items").update(update).eq("id", itemId).eq("scrapbook_id", scrapbookId);

  if (error) {
    return { error: "That page could not be saved." };
  }

  revalidatePath(`/me/scrapbooks/${scrapbookId}`);
  return { ok: true };
}

export async function moveScrapbookItem(scrapbookId: string, itemId: string, direction: "up" | "down") {
  const guestId = await readGuestId();
  const admin = createAdminClient();

  if (!guestId || !admin || !ID.test(scrapbookId) || !ID.test(itemId)) {
    return { error: "That page could not be moved." };
  }

  const { data: scrapbook } = await admin
    .from("scrapbooks")
    .select("id")
    .eq("id", scrapbookId)
    .eq("guest_id", guestId)
    .maybeSingle();

  if (!scrapbook) {
    return { error: "That scrapbook was not found." };
  }

  const { data: items } = await admin
    .from("scrapbook_items")
    .select("id, position")
    .eq("scrapbook_id", scrapbookId)
    .order("position", { ascending: true });
  const list = items ?? [];
  const index = list.findIndex((item) => item.id === itemId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;

  if (index < 0 || swapIndex < 0 || swapIndex >= list.length) {
    return { ok: true };
  }

  const current = list[index];
  const neighbor = list[swapIndex];
  await admin.from("scrapbook_items").update({ position: neighbor.position }).eq("id", current.id);
  await admin.from("scrapbook_items").update({ position: current.position }).eq("id", neighbor.id);
  revalidatePath(`/me/scrapbooks/${scrapbookId}`);
  return { ok: true };
}

export async function setScrapbookTheme(scrapbookId: string, theme: ScrapbookTheme) {
  const guestId = await readGuestId();
  const admin = createAdminClient();

  if (!guestId || !admin || !ID.test(scrapbookId)) {
    return { error: "That scrapbook was not found." };
  }

  const { error } = await admin
    .from("scrapbooks")
    .update({ theme: parseTheme(theme) })
    .eq("id", scrapbookId)
    .eq("guest_id", guestId);

  if (error) {
    return { error: "The theme could not be saved." };
  }

  revalidatePath(`/me/scrapbooks/${scrapbookId}`);
  return { ok: true };
}
