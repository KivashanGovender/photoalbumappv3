import OpenAI from "openai";
import { curateEventPhotos } from "@/lib/curate";

export const maxDuration = 60;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params;

  if (!process.env.OPENAI_API_KEY) {
    const error = "Add OPENAI_API_KEY to .env.local, then restart the dev server.";
    console.error("Curation request failed:", error);
    return Response.json({ error }, { status: 503 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 15000, maxRetries: 0 });
  const result = await curateEventPhotos(eventId, openai, { batchSize: 2 });

  if ("status" in result) {
    console.error("Curation request failed:", result.error);
    return Response.json({ error: result.error }, { status: result.status });
  }

  if (result.error) {
    console.error("Curation request failed:", result.error);
  }

  return Response.json(result);
}
