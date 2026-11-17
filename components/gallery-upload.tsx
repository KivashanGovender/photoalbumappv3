"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadApprovedPhoto } from "@/app/actions/photos";
import { secondaryButton } from "@/components/ui";

export function GalleryUpload({
  slug,
  uploaderName,
  host = false,
  onNeedName,
  label = "Upload photos",
  className = secondaryButton,
  captureVideo = false,
  autoOpen = false,
  onAutoOpen,
}: {
  slug: string;
  uploaderName: string | null;
  host?: boolean;
  onNeedName?: () => void;
  label?: string;
  className?: string;
  captureVideo?: boolean;
  autoOpen?: boolean;
  onAutoOpen?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";

    if (!files.length || !uploaderName) {
      return;
    }

    const uploadable = files.filter((file) => file.size <= 50 * 1024 * 1024);
    const oversized = files.length - uploadable.length;

    setPending(true);
    setMessage("");
    setError("");
    let saved = 0;
    let firstError = "";

    for (const file of uploadable) {
      const formData = new FormData();
      formData.set("slug", slug);
      formData.set("uploaderName", uploaderName);
      formData.set("photo", file);
      if (host) {
        formData.set("asHost", "1");
      }

      const result = await uploadApprovedPhoto(formData);

      if (result.error) {
        firstError = firstError || result.error;
      } else {
        saved += 1;
      }
    }

    setPending(false);
    if (oversized > 0) {
      firstError = firstError || "Video must be under 50MB";
    }
    if (saved > 0) {
      const videos = uploadable.filter((file) => file.type.startsWith("video/") || /\.(mp4|mov)$/i.test(file.name)).length;
      setMessage(
        videos > 0 && videos === saved
          ? saved === 1
            ? "1 video added to the album."
            : `${saved} videos added to the album.`
          : saved === 1
            ? "1 photo added to the album."
            : `${saved} photos added to the album.`,
      );
      router.refresh();
    }
    if (firstError) {
      setError(saved > 0 ? `${firstError} The other files were added.` : firstError);
    }
  }

  useEffect(() => {
    if (!autoOpen || !uploaderName) {
      return;
    }

    inputRef.current?.click();
    onAutoOpen?.();
  }, [autoOpen, onAutoOpen, uploaderName]);

  return (
    <div className="grid gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!uploaderName) {
            onNeedName?.();
            return;
          }
          inputRef.current?.click();
        }}
        className={className}
      >
        {pending ? "Uploading…" : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={captureVideo ? "video/*" : "image/*,video/*"}
        capture={captureVideo ? "environment" : undefined}
        multiple={!captureVideo}
        className="sr-only"
        onChange={(event) => void onChange(event)}
      />
      {message ? (
        <p className="text-center text-sm font-medium text-stone-800" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-center text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
