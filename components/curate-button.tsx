"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { primaryButton } from "@/components/ui";

type CurateResponse = {
  curated?: number;
  kept?: number;
  culled?: number;
  remaining?: number;
  error?: string;
};

export function CurateButton({
  eventId,
  waiting,
}: {
  eventId: string;
  waiting: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function run() {
    setPending(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/events/${eventId}/curate`, { method: "POST" });
      const body = (await response.json()) as CurateResponse;

      if (!response.ok) {
        setError(body.error || "Curation failed.");
        return;
      }

      const curated = body.curated ?? 0;
      const remaining = body.remaining ?? 0;
      const summary =
        curated === 0 && remaining > 0
          ? "Curation did not finish."
          : curated === 0
            ? "No photos were waiting."
            : `Curated ${curated}: ${body.kept ?? 0} kept, ${body.culled ?? 0} hidden.`;
      setMessage(remaining > 0 ? `${summary} ${remaining} still waiting. Run it again.` : summary);
      if (body.error) {
        setError(body.error);
      }
      router.refresh();
    } catch {
      setError("Curation could not be reached.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-3">
      <button
        type="button"
        onClick={() => void run()}
        disabled={pending || waiting === 0}
        className={`${primaryButton} w-fit`}
      >
        {pending ? "Curating photos…" : "Run AI Curation"}
      </button>
      {message ? (
        <p className="text-sm font-medium text-stone-800" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
