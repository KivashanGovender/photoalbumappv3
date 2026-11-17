"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { primaryButton, secondaryButton } from "@/components/ui";

export function ShareEvent({ slug, title }: { slug: string; title: string }) {
  const [url, setUrl] = useState("");
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    const next = `${window.location.origin}/e/${slug}`;
    setUrl(next);
    let cancelled = false;

    void QRCode.toDataURL(next, {
      margin: 1,
      width: 192,
      color: { dark: "#1c1917", light: "#ffffff" },
    }).then((dataUrl) => {
      if (!cancelled) {
        setQr(dataUrl);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setNote("Select the link and copy it.");
    }
  }

  async function share() {
    if (!url) {
      return;
    }

    if (!navigator.share) {
      await copy();
      setNote("Link copied. Paste it into a text or email.");
      return;
    }

    try {
      await navigator.share({
        title,
        text: `Join ${title} and add your photos.`,
        url,
      });
      setNote("");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      await copy();
      setNote("Sharing was unavailable, so the link was copied.");
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
      <div className="grid h-48 w-48 place-items-center rounded-2xl border-2 border-stone-300 bg-white">
        {qr ? (
          // Generated on this device from the public guest URL.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt={`QR code that opens ${title}`} width={176} height={176} />
        ) : (
          <p className="px-4 text-center text-sm font-semibold text-stone-800">Preparing code…</p>
        )}
      </div>
      <div className="grid gap-3">
        <p className="text-sm font-semibold text-stone-800">Guest link</p>
        <p className="break-all rounded-lg border-2 border-stone-300 bg-stone-50 px-3 py-2 font-mono text-sm text-stone-950">
          {url || `/e/${slug}`}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button type="button" onClick={() => void copy()} className={`${primaryButton} w-full sm:w-auto`}>
            {copied ? "✓ Copied!" : "Copy Link"}
          </button>
          <button type="button" onClick={() => void share()} className={`${secondaryButton} w-full sm:w-auto`}>
            Share Event
          </button>
        </div>
        <p className="sr-only" aria-live="polite">
          {copied ? "Copied" : note}
        </p>
        {note ? <p className="text-sm font-medium text-stone-800">{note}</p> : null}
      </div>
    </div>
  );
}
