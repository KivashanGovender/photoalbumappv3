"use client";

import { useEffect, useId, useRef, useState } from "react";
import { themeStyle, type ScrapbookTheme } from "@/lib/themes";

export function StoryDownload({
  photoId,
  eventTitle,
  caption,
  uploaderName,
  eventDate,
  theme = "editorial",
}: {
  photoId: string;
  eventTitle: string;
  caption: string | null;
  uploaderName: string;
  eventDate?: string | null;
  theme?: ScrapbookTheme;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    closeRef.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, open]);

  async function download() {
    setBusy(true);
    setError("");

    try {
      const response = await fetch(`/api/photos/${photoId}`);

      if (!response.ok) {
        throw new Error("The photo could not be loaded.");
      }

      const blob = await response.blob();
      const image = await createImageBitmap(blob);
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("The story could not be drawn.");
      }

      const paint = themeStyle(theme).paint;
      context.fillStyle = paint.background;
      context.fillRect(0, 0, canvas.width, canvas.height);
      if (paint.frame === "film") {
        drawChecker(context, canvas.width);
      }
      drawFrame(context, paint.frame, paint.accent, 72, 96, 936, 1180);
      drawCover(context, image, 108, 150, 864, 1000);
      context.fillStyle = paint.accent;
      context.font = paint.bodyFont.replace(/^\d+px/, "28px");
      context.fillText("EVENTALBUM", 80, 1360);
      context.fillStyle = paint.muted;
      context.fillText(eventDate || "The album", 80, 1410);
      context.fillStyle = paint.ink;
      context.font = paint.titleFont;
      const titleBottom = wrapText(context, eventTitle, 80, 1500, 920, 72);
      context.font = paint.bodyFont;
      context.fillStyle = paint.ink;
      const captionBottom = wrapText(context, caption || "A moment from the album.", 80, titleBottom + 36, 920, 46);
      context.fillStyle = paint.muted;
      context.fillText(uploaderName, 80, Math.min(captionBottom + 64, 1840));

      const file = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/png");
      });

      if (!file) {
        throw new Error("The story could not be saved.");
      }

      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = "eventalbum-story.png";
      link.click();
      URL.revokeObjectURL(url);
      image.close();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The story could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  const style = themeStyle(theme);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
        className={`h-11 rounded-full px-4 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950 ${style.button}`}
      >
        Download Story (9:16)
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-stone-950/80 p-4" onClick={() => !busy && setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="grid max-h-[92dvh] w-full max-w-sm gap-4 overflow-auto rounded-3xl bg-white p-4 text-stone-950 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id={titleId} className="text-lg font-bold">Story export</h2>
            <div
              className="mx-auto flex aspect-[9/16] w-full max-w-[280px] flex-col overflow-hidden rounded-2xl border-4"
              style={{
                background: style.paint.background,
                color: style.paint.ink,
                borderColor: style.paint.accent,
                fontFamily: style.fontFamily,
              }}
            >
              {/* Same-origin photo route. The optimizer would drop the host session cookie. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/photos/${photoId}`}
                alt=""
                className="m-3 h-[58%] w-[calc(100%-1.5rem)] object-cover"
                style={{ boxShadow: `0 0 0 3px ${style.paint.accent}` }}
              />
              <div className="grid flex-1 content-start gap-2 px-4">
                <p className="text-[10px] font-semibold tracking-[0.22em]" style={{ color: style.paint.accent }}>EVENTALBUM</p>
                {eventDate ? <p className="text-[10px]" style={{ color: style.paint.muted }}>{eventDate}</p> : null}
                <p className="text-lg leading-tight font-semibold">{eventTitle}</p>
                <p className="text-sm leading-5">{caption || "A moment from the album."}</p>
                <p className="text-xs" style={{ color: style.paint.muted }}>{uploaderName}</p>
              </div>
            </div>
            {error ? (
              <p className="text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                ref={closeRef}
                onClick={() => setOpen(false)}
                className="h-11 rounded-full border-2 border-stone-950 text-sm font-bold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => void download()}
                disabled={busy}
                className="h-11 rounded-full bg-stone-950 text-sm font-bold text-white disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save image"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function drawChecker(context: CanvasRenderingContext2D, width: number) {
  const size = 40;
  for (let y = 0; y < 80; y += size) {
    for (let x = 0; x < width; x += size) {
      context.fillStyle = (x / size + y / size) % 2 === 0 ? "#111111" : "#f5f5f4";
      context.fillRect(x, y, size, size);
      context.fillRect(x, 1840 + y, size, size);
    }
  }
}

function drawFrame(
  context: CanvasRenderingContext2D,
  frame: string,
  accent: string,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  if (frame === "polaroid") {
    context.fillStyle = "#fffaf3";
    context.fillRect(x - 28, y - 28, width + 56, height + 120);
    return;
  }

  if (frame === "gold" || frame === "wood") {
    context.strokeStyle = accent;
    context.lineWidth = frame === "wood" ? 28 : 8;
    context.strokeRect(x - 16, y - 16, width + 32, height + 32);
    return;
  }

  if (frame === "neon") {
    context.strokeStyle = "#00F0FF";
    context.lineWidth = 8;
    context.strokeRect(x - 18, y - 18, width + 36, height + 36);
    context.strokeStyle = accent;
    context.lineWidth = 4;
    context.strokeRect(x - 8, y - 8, width + 16, height + 16);
    return;
  }

  if (frame === "film") {
    context.fillStyle = "#111111";
    context.fillRect(x - 36, y - 20, 28, height + 40);
    context.fillRect(x + width + 8, y - 20, 28, height + 40);
    context.fillStyle = "#fafafa";
    for (let hole = y; hole < y + height; hole += 48) {
      context.beginPath();
      context.arc(x - 22, hole, 7, 0, Math.PI * 2);
      context.arc(x + width + 22, hole, 7, 0, Math.PI * 2);
      context.fill();
    }
    return;
  }

  if (frame === "soft") {
    context.strokeStyle = accent;
    context.lineWidth = 16;
    context.beginPath();
    context.roundRect(x - 20, y - 20, width + 40, height + 40, 48);
    context.stroke();
  }
}

function drawCover(
  context: CanvasRenderingContext2D,
  image: ImageBitmap,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.max(width / image.width, height / image.height);
  const drawnWidth = image.width * scale;
  const drawnHeight = image.height * scale;
  context.save();
  context.beginPath();
  context.roundRect(x, y, width, height, 40);
  context.clip();
  context.drawImage(image, x + (width - drawnWidth) / 2, y + (height - drawnHeight) / 2, drawnWidth, drawnHeight);
  context.restore();
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/);
  let line = "";
  let cursor = y;

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (context.measureText(next).width > maxWidth && line) {
      context.fillText(line, x, cursor);
      line = word;
      cursor += lineHeight;
    } else {
      line = next;
    }
  }

  if (line) {
    context.fillText(line, x, cursor);
  }

  return cursor;
}
