import OpenAI from "openai";
import sharp from "sharp";
import { readFromR2 } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";

const MODEL = "gpt-4o-mini";
const BATCH_SIZE = 2;
const MAX_PER_RUN = 8;
const MAX_WIDTH = 512;

export type CurateResult = {
  curated: number;
  kept: number;
  culled: number;
  remaining: number;
  error?: string;
};

type PhotoRow = {
  id: string;
  storage_path: string;
  uploader_name: string | null;
  created_at: string;
};

type Decision = {
  id: string;
  isCulled: boolean;
  cullReason: string | null;
  chapterTitle: string | null;
  aiCaption: string | null;
};

export async function curateEventPhotos(
  eventId: string,
  openai: OpenAI,
  options?: { batchSize?: number },
): Promise<CurateResult | { status: number; error: string }> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId)) {
    return { status: 400, error: "That event id is not valid." };
  }

  const supabase = await createClient();

  if (!supabase) {
    return { status: 503, error: "Supabase is not configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: 401, error: "Sign in as the host to curate this album." };
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, host_id, title, description, event_date, location")
    .eq("id", eventId)
    .eq("host_id", user.id)
    .maybeSingle();

  if (eventError) {
    return { status: 500, error: "The event could not be loaded." };
  }

  if (!event) {
    return { status: 404, error: "That event was not found." };
  }

  const { data: waiting, error: photosError } = await supabase
    .from("photos")
    .select("id, storage_path, uploader_name, created_at")
    .eq("event_id", eventId)
    .is("analyzed_at", null)
    .order("created_at", { ascending: true })
    .limit(MAX_PER_RUN + 1);

  if (photosError) {
    return {
      status: 500,
      error: "The curation columns are missing. Run the photos curation SQL in Supabase, then try again.",
    };
  }

  const rows = (waiting ?? []) as PhotoRow[];
  const batchRows = rows.slice(0, MAX_PER_RUN);
  const remainingAfterFetch = Math.max(rows.length - batchRows.length, 0);

  if (batchRows.length === 0) {
    return { curated: 0, kept: 0, culled: 0, remaining: 0 };
  }

  const { data: chapterRows } = await supabase
    .from("photos")
    .select("chapter_title")
    .eq("event_id", eventId)
    .eq("is_culled", false)
    .not("chapter_title", "is", null);

  const chapters = new Set<string>();
  for (const row of chapterRows ?? []) {
    if (row.chapter_title) {
      chapters.add(row.chapter_title);
    }
  }

  const batchSize = options?.batchSize ?? BATCH_SIZE;
  let curated = 0;
  let kept = 0;
  let culled = 0;
  let failed = 0;
  let lastError = "";

  for (let index = 0; index < batchRows.length; index += batchSize) {
    const batch = batchRows.slice(index, index + batchSize);

    try {
      const decisions = await judgeBatch(openai, event, batch, [...chapters]);
      const decidedIds = new Set(decisions.map((decision) => decision.id));
      failed += batch.filter((photo) => !decidedIds.has(photo.id)).length;

      for (const decision of decisions) {
        const { error } = await supabase
          .from("photos")
          .update({
            is_culled: decision.isCulled,
            cull_reason: decision.isCulled ? decision.cullReason : null,
            chapter_title: decision.isCulled ? null : decision.chapterTitle,
            ai_caption: decision.isCulled ? null : decision.aiCaption,
            analyzed_at: new Date().toISOString(),
          })
          .eq("id", decision.id)
          .eq("event_id", eventId);

        if (error) {
          failed += 1;
          lastError = "A curation result could not be saved.";
          continue;
        }

        curated += 1;
        if (decision.isCulled) {
          culled += 1;
        } else {
          kept += 1;
          if (decision.chapterTitle) {
            chapters.add(decision.chapterTitle);
          }
        }
      }
    } catch (error) {
      failed += batch.length;
      lastError = describeError(error);
      console.error("Curation batch failed", error);
    }
  }

  return {
    curated,
    kept,
    culled,
    remaining: remainingAfterFetch + failed,
    error: lastError || undefined,
  };
}

async function judgeBatch(
  openai: OpenAI,
  event: {
    title: string;
    description: string | null;
    event_date: string | null;
    location: string | null;
  },
  photos: PhotoRow[],
  chapters: string[],
): Promise<Decision[]> {
  const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    {
      type: "text",
      text: [
        "You are the photo editor for a private event album.",
        `Event: ${event.title}`,
        event.event_date ? `Date: ${event.event_date}` : "",
        event.location ? `Location: ${event.location}` : "",
        event.description ? `Notes: ${event.description}` : "",
        chapters.length > 0 ? `Chapters already used, reuse one when it fits: ${chapters.join("; ")}` : "",
        "The photos are in chronological order. For each photo:",
        "- Cull it when it is blurry, pitch-dark, an accidental pocket or floor shot, or a near-duplicate of a sharper photo in this batch.",
        "- Keep one photo from a near-duplicate pair.",
        "- For a keeper, assign a short chapter title of two to five words, such as Arrival & Cocktails, The Speeches, or Dance Floor. Keep the timeline moving forward.",
        "- For a keeper, write one or two warm, witty magazine-style sentences. Mention the uploader's name and the time. Do not invent names, relationships, or objects that are not clear in the photo.",
        "- For a culled photo, leave the chapter and caption empty and put a short reason in cull_reason.",
        "Return only the photos listed below, using their exact ids.",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];

  for (const photo of photos) {
    const file = await readFromR2(photo.storage_path);

    if (!file.contentType.startsWith("image/")) {
      throw new Error(`R2 image download returned ${file.contentType}, which is not an image.`);
    }

    const jpeg = await resizeForVision(file.bytes);

    content.push({
      type: "text",
      text: `Photo id ${photo.id}. Uploader: ${photo.uploader_name || "A guest"}. Time: ${photo.created_at}.`,
    });
    content.push({
      type: "image_url",
      image_url: {
        url: `data:image/jpeg;base64,${jpeg.toString("base64")}`,
      },
    });
  }

  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content }],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "photo_curation",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            photos: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  id: { type: "string" },
                  is_culled: { type: "boolean" },
                  cull_reason: { type: "string" },
                  chapter_title: { type: "string" },
                  ai_caption: { type: "string" },
                },
                required: ["id", "is_culled", "cull_reason", "chapter_title", "ai_caption"],
              },
            },
          },
          required: ["photos"],
        },
      },
    },
  });

  const text = completion.choices[0]?.message.content;

  if (!text) {
    throw new Error("OpenAI returned an empty response.");
  }

  const parsed = parseCurationJson(text) as {
    photos?: Array<{
      id?: string;
      is_culled?: boolean;
      cull_reason?: string;
      chapter_title?: string;
      ai_caption?: string;
    }>;
  };
  const allowed = new Set(photos.map((photo) => photo.id));
  const decisions: Decision[] = [];

  for (const item of parsed.photos ?? []) {
    if (!item.id || !allowed.has(item.id) || typeof item.is_culled !== "boolean") {
      continue;
    }

    const cullReason = clip(item.cull_reason, 180);
    const chapterTitle = clip(item.chapter_title, 80);
    const aiCaption = clip(item.ai_caption, 400);

    if (item.is_culled) {
      decisions.push({
        id: item.id,
        isCulled: true,
        cullReason: cullReason || "Hidden by the photo editor",
        chapterTitle: null,
        aiCaption: null,
      });
      continue;
    }

    if (!chapterTitle || !aiCaption) {
      continue;
    }

    decisions.push({
      id: item.id,
      isCulled: false,
      cullReason: null,
      chapterTitle,
      aiCaption,
    });
  }

  return decisions;
}

async function resizeForVision(bytes: Uint8Array) {
  return sharp(bytes).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true }).jpeg({ quality: 70 }).toBuffer();
}

function parseCurationJson(text: string) {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  try {
    return JSON.parse(trimmed) as unknown;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "invalid JSON";
    throw new Error(`JSON parsing failed: ${detail}`);
  }
}

function describeError(error: unknown) {
  const status = error && typeof error === "object" && "status" in error ? Number(error.status) : undefined;
  const message = (error instanceof Error ? error.message : "Unknown curation error.")
    .replace(/AIza[0-9A-Za-z_-]+/g, "[redacted]")
    .replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]")
    .slice(0, 500);

  if (Number.isFinite(status)) {
    return `${status}: ${message}`;
  }

  return message;
}

function clip(value: string | undefined, max: number) {
  if (!value) {
    return null;
  }

  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed ? trimmed.slice(0, max) : null;
}
