import OpenAI from "openai";
import { THEMES, parseTheme, type ScrapbookTheme } from "@/lib/themes";

export type ScrapbookSource = {
  id: string;
  uploader_name: string | null;
  created_at: string;
  chapter_title: string | null;
  ai_caption: string | null;
};

export type ScrapbookDraft = {
  title: string;
  theme: ScrapbookTheme;
  pages: Array<{ photoId: string; chapterTitle: string; caption: string }>;
};

export async function draftPersonalScrapbook(guestName: string, eventTitle: string, photos: ScrapbookSource[]) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Add OPENAI_API_KEY to .env.local, then restart the dev server.");
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 15000, maxRetries: 0 });
  const catalog = photos
    .map(
      (photo, index) =>
        `${index + 1}. id ${photo.id}. Uploader: ${photo.uploader_name || "A guest"}. Time: ${photo.created_at}. Chapter: ${photo.chapter_title || "Album"}. Caption: ${photo.ai_caption || "No caption yet."}`,
    )
    .join("\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          `Build a personal scrapbook for ${guestName} from the album "${eventTitle}".`,
          "Use only the photo ids listed below. Keep the guest's own photos near the front when their name matches.",
          "Write a short title, choose a theme, and give every selected photo a chapter title and a warm caption.",
          catalog,
        ].join("\n"),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "personal_scrapbook",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            theme: { type: "string", enum: [...THEMES] },
            pages: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  photo_id: { type: "string" },
                  chapter_title: { type: "string" },
                  caption: { type: "string" },
                },
                required: ["photo_id", "chapter_title", "caption"],
              },
            },
          },
          required: ["title", "theme", "pages"],
        },
      },
    },
  });

  const text = completion.choices[0]?.message.content;

  if (!text) {
    throw new Error("OpenAI returned an empty scrapbook.");
  }

  const parsed = JSON.parse(text) as {
    title?: string;
    theme?: string;
    pages?: Array<{ photo_id?: string; chapter_title?: string; caption?: string }>;
  };
  const allowed = new Map(photos.map((photo) => [photo.id, photo]));
  const pages = [];

  for (const page of parsed.pages ?? []) {
    if (!page.photo_id || !allowed.has(page.photo_id)) {
      continue;
    }

    pages.push({
      photoId: page.photo_id,
      chapterTitle: (page.chapter_title || "Album").slice(0, 80),
      caption: (page.caption || "A moment from the album.").slice(0, 400),
    });
    allowed.delete(page.photo_id);
  }

  for (const photo of allowed.values()) {
    pages.push({
      photoId: photo.id,
      chapterTitle: photo.chapter_title || "Album",
      caption: photo.ai_caption || "A moment from the album.",
    });
  }

  return {
    title: (parsed.title || `${guestName}'s scrapbook`).slice(0, 80),
    theme: parseTheme(parsed.theme),
    pages,
  } satisfies ScrapbookDraft;
}
