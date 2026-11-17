"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { uploadGuestPhoto } from "@/app/actions/photos";
import { GalleryUpload } from "@/components/gallery-upload";
import { HowItWorks } from "@/components/how-it-works";
import { PhotoGrid, type AlbumPhoto } from "@/components/photo-grid";
import { CreateScrapbookButton } from "@/components/guest-controls";
import { AlbumDownload } from "@/components/album-download";
import { AlbumSaveControls } from "@/components/album-save-controls";
import { AlbumThemeSection } from "@/components/album-theme-switcher";
import { ThemeCover } from "@/components/theme-cover";
import { primaryButton, secondaryButton } from "@/components/ui";
import { formatEventDate } from "@/lib/events";
import { joinEvent } from "@/app/actions/album";
import { guestLine, isAlbumTemplate, themeStyle, type AlbumLook } from "@/lib/themes";

const NAME_KEY = "eventalbum.guestFirstName";
const MAX_EDGE = 1600;

export type GuestEvent = {
  title: string;
  subtitle: string | null;
  description: string | null;
  eventDate: string | null;
  location: string | null;
  slug: string;
};

export function GuestUpload({
  event,
  chapters,
  released,
  theme,
  isHost,
  pickedIds,
}: {
  event: GuestEvent;
  chapters: Array<[string, AlbumPhoto[]]>;
  released: boolean;
  theme: AlbumLook;
  isHost: boolean;
  pickedIds: string[];
}) {
  const [name, setName] = useState<string | null>(null);
  const [mode, setMode] = useState<"album" | "name" | "camera">("album");
  const [panel, setPanel] = useState<"feed" | "book">("feed");
  const [afterName, setAfterName] = useState<"camera" | "gallery" | "video">("camera");
  const [openRecorder, setOpenRecorder] = useState(false);
  const [look, setLook] = useState(theme);
  const albumRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(NAME_KEY)?.trim() ?? "";
    if (stored) {
      setName(stored);
      void joinEvent(event.slug, stored);
    }
  }, [event.slug]);

  if (mode === "camera" && name) {
    return (
      <CameraStep
        event={event}
        name={name}
        onChangeName={() => {
          window.localStorage.removeItem(NAME_KEY);
          setName(null);
          setMode("name");
        }}
        onClose={() => setMode("album")}
      />
    );
  }

  const dateLabel = event.eventDate ? formatEventDate(event.eventDate) : null;
  const style = isAlbumTemplate(look) ? null : themeStyle(look);
  const guests = guestLine(chapters.flatMap(([, photos]) => photos.map((photo) => photo.uploader_name)));

  return (
    <GuestShell event={event}>
      <div className="grid w-full gap-6 pb-40">
        {isHost ? (
          <AlbumSaveControls slug={event.slug} title={event.title} subtitle={event.subtitle ?? ""} theme={look} />
        ) : null}
        <AlbumThemeSection slug={event.slug} theme={look} isHost={isHost} onChange={setLook} />
        <AlbumDownload slug={event.slug} albumRef={albumRef} />
        <div ref={albumRef} className={`grid gap-6 rounded-3xl p-3 sm:p-5 ${style?.page ?? "bg-stone-50 text-stone-950"}`}>
        {isAlbumTemplate(look) ? null : <ThemeCover theme={look} title={event.title} date={dateLabel} guests={guests} />}
        {released ? (
          <div
            role="tablist"
            aria-label="Album views"
            data-album-export="ignore"
            className="grid grid-cols-2 gap-1 rounded-full bg-white p-1 ring-2 ring-stone-950"
          >
            <button
              type="button"
              role="tab"
              aria-selected={panel === "feed"}
              onClick={() => setPanel("feed")}
              className={`h-11 rounded-full px-2 text-xs font-bold sm:text-sm ${panel === "feed" ? "bg-stone-950 text-white" : "text-stone-950"}`}
            >
              Live Photo Feed
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={panel === "book"}
              onClick={() => setPanel("book")}
              aria-label="Digital Scrapbook Book View"
              className={`h-11 rounded-full px-2 text-xs font-bold sm:text-sm ${panel === "book" ? "bg-stone-950 text-white" : "text-stone-950"}`}
            >
              Book View
            </button>
          </div>
        ) : (
          <p className="rounded-2xl border border-stone-300 bg-white px-5 py-4 text-sm font-medium leading-6 text-stone-800">
            The host has not released this album yet. You can still take or upload photos.
          </p>
        )}
        {mode === "name" ? (
          <NameStep
            continueLabel={
              afterName === "gallery" ? "Continue" : afterName === "video" ? "Continue to record" : "Continue to camera"
            }
            onSave={(value) => {
              window.localStorage.setItem(NAME_KEY, value);
              setName(value);
              void joinEvent(event.slug, value);
              setMode(afterName === "camera" ? "camera" : "album");
              if (afterName === "video") {
                setOpenRecorder(true);
              }
            }}
          />
        ) : null}
        {released && panel === "book" ? (
          <div className="grid gap-4">
            <a href={`/e/${event.slug}/book`} className={secondaryButton}>
              Open full-screen book
            </a>
            {chapters.length === 0 ? (
              <p className="rounded-2xl border border-stone-300 bg-white px-5 py-4 text-sm font-medium text-stone-800">
                Curated chapters will fill the book after the host releases them.
              </p>
            ) : (
              chapters.map(([chapter, photos]) => (
                <section key={chapter} className="grid gap-3">
                  <h2 className={`text-2xl font-bold tracking-tight ${style?.chapter ?? ""}`} style={style ? { fontFamily: style.fontFamily } : undefined}>{chapter}</h2>
                  <PhotoGrid
                    photos={photos}
                    eventTitle={event.title}
                    eventDate={dateLabel}
                    slug={event.slug}
                    theme={look}
                    pickedIds={pickedIds}
                  />
                </section>
              ))
            )}
          </div>
        ) : released ? (
          chapters.length === 0 ? (
            <p className="rounded-2xl border border-stone-300 bg-white px-5 py-4 text-sm font-medium text-stone-800">
              Curated photos will appear here, grouped into chapters.
            </p>
          ) : (
            chapters.map(([chapter, photos]) => (
              <section key={chapter} className="grid gap-3">
                <h2 className={`text-lg font-bold ${style?.chapter ?? ""}`} style={style ? { fontFamily: style.fontFamily } : undefined}>{chapter}</h2>
                <PhotoGrid
                  photos={photos}
                  eventTitle={event.title}
                  eventDate={dateLabel}
                  slug={event.slug}
                  theme={look}
                  pickedIds={pickedIds}
                />
              </section>
            ))
          )
        ) : null}
        </div>
        {released && panel === "feed" && pickedIds.length > 0 ? (
          <CreateScrapbookButton slug={event.slug} count={pickedIds.length} />
        ) : null}
        <a href="/me" className="w-fit text-sm font-semibold text-stone-950 underline">
          Saved Albums
        </a>
      </div>
      {mode !== "name" ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-300 bg-[#f3eee6]/95 px-5 py-3 backdrop-blur">
          <div className="mx-auto grid w-full max-w-md gap-2">
            <button
              type="button"
              onClick={() => {
                if (!name) {
                  setAfterName("camera");
                  setMode("name");
                  return;
                }
                setMode("camera");
              }}
              className={primaryButton}
            >
              Take photo
            </button>
            <GalleryUpload
              slug={event.slug}
              uploaderName={name}
              label="Upload Media"
              className={`${secondaryButton} w-full`}
              onNeedName={() => {
                setAfterName("gallery");
                setMode("name");
              }}
            />
            <GalleryUpload
              slug={event.slug}
              uploaderName={name}
              label="Record Video"
              captureVideo
              autoOpen={openRecorder}
              onAutoOpen={() => setOpenRecorder(false)}
              className={`${secondaryButton} w-full`}
              onNeedName={() => {
                setAfterName("video");
                setMode("name");
              }}
            />
          </div>
        </div>
      ) : null}
    </GuestShell>
  );
}

function GuestShell({
  event,
  children,
}: {
  event: GuestEvent;
  children: React.ReactNode;
}) {
  const details = [
    event.eventDate ? formatEventDate(event.eventDate) : null,
    event.location,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <main className="flex min-h-dvh flex-col bg-[#f3eee6] text-stone-950">
      <header className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pt-6 pb-2 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] uppercase">EventAlbum</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">{event.title}</h1>
          {event.subtitle ? <p className="mt-2 text-base font-medium text-stone-800">{event.subtitle}</p> : null}
          {details ? <p className="mt-2 text-sm font-medium text-stone-800">{details}</p> : null}
          {event.description ? (
            <p className="mt-3 max-w-md text-sm leading-6 text-stone-800">{event.description}</p>
          ) : null}
        </div>
        <HowItWorks />
      </header>
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6">{children}</section>
    </main>
  );
}

function NameStep({
  onSave,
  continueLabel,
}: {
  onSave: (name: string) => void;
  continueLabel: string;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function submit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const next = value.trim().replace(/\s+/g, " ");

    if (!/^[\p{L}][\p{L}\s'.-]{0,39}$/u.test(next)) {
      setError("Enter a first name using letters, spaces, hyphens, or apostrophes.");
      return;
    }

    onSave(next);
  }

  return (
    <form onSubmit={submit} className="mx-auto grid w-full max-w-md flex-1 content-center gap-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">What is your first name?</h2>
        <p className="mt-2 text-sm leading-6 font-medium text-stone-800">
          It is saved on this phone and added to the photos you take.
        </p>
      </div>
      <label className="grid gap-2 text-sm font-medium">
        First name
        <input
          value={value}
          onChange={(inputEvent) => setValue(inputEvent.target.value)}
          autoComplete="given-name"
          autoFocus
          maxLength={40}
          required
          className="h-12 rounded-lg border-2 border-stone-400 bg-white px-3 text-base font-normal outline-none focus:border-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
        />
      </label>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        className={primaryButton}
      >
        {continueLabel}
      </button>
    </form>
  );
}

function CameraStep({
  event,
  name,
  onChangeName,
  onClose,
}: {
  event: GuestEvent;
  name: string;
  onChangeName: () => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recordRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [previewFacing, setPreviewFacing] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    const video = videoRef.current;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("This browser cannot open the camera. Use Upload Media or Record Video below.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        setCameraError("");
        const actualFacing = stream.getVideoTracks()[0]?.getSettings().facingMode;
        setPreviewFacing(actualFacing === "user" || actualFacing === "environment" ? actualFacing : facingMode);

        if (video) {
          video.srcObject = stream;
          await video.play();
        }
      } catch {
        if (!cancelled) {
          setCameraError("Camera access was blocked. Allow the camera, or use Upload Media or Record Video.");
        }
      }
    }

    if (!previewUrl) {
      void startCamera();
    }

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [facingMode, previewUrl]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function useBlob(blob: Blob) {
    setError("");
    setMessage("");
    setPhoto(blob);
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return URL.createObjectURL(blob);
    });
  }

  async function takePhoto() {
    const video = videoRef.current;

    if (!video || !video.videoWidth) {
      fileRef.current?.click();
      return;
    }

    const scale = Math.min(1, MAX_EDGE / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext("2d");

    if (!context) {
      setError("The photo could not be captured.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.85);
    });

    if (!blob) {
      setError("The photo could not be captured.");
      return;
    }

    await useBlob(blob);
  }

  function uploadPickedFile(file: File) {
    if (file.size > 50 * 1024 * 1024) {
      setError("Video must be under 50MB");
      return;
    }

    const video = file.type.startsWith("video/") || /\.(mp4|mov)$/i.test(file.name);
    if (video) {
      const formData = new FormData();
      formData.set("slug", event.slug);
      formData.set("uploaderName", name);
      formData.set("photo", file);
      setError("");
      startTransition(async () => {
        const result = await uploadGuestPhoto(formData);
        setError(result.error ?? "");
        if (!result.error) {
          setMessage("Video added to the album.");
        }
      });
      return;
    }

    void useBlob(file);
  }

  function upload() {
    if (!photo) {
      return;
    }

    const formData = new FormData();
    formData.set("slug", event.slug);
    formData.set("uploaderName", name);
    formData.set("photo", new File([photo], "photo.jpg", { type: photo.type || "image/jpeg" }));
    setError("");

    startTransition(async () => {
      const result = await uploadGuestPhoto(formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      setPhoto(null);
      setPreviewUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
        return null;
      });
      setMessage("Photo added to the album.");
    });
  }

  return (
    <div className="flex min-h-dvh justify-center bg-stone-950 lg:bg-[#1c1917] lg:p-8">
    <main className="flex w-full max-w-lg flex-1 flex-col bg-stone-950 text-white lg:rounded-[2rem] lg:shadow-2xl">
      <header className="flex flex-wrap items-start justify-between gap-3 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-3 sm:px-5">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-stone-200 uppercase">Camera</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight">{event.title}</h1>
          <p className="mt-1 text-sm font-medium text-stone-100">{name}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-full bg-white px-4 text-sm font-bold text-stone-950">
            Feed
          </button>
          <button type="button" onClick={onChangeName} className="h-10 rounded-full border-2 border-white px-4 text-sm font-bold text-white">
            Name
          </button>
        </div>
      </header>
      <div className="relative mx-4 flex-1 overflow-hidden rounded-3xl bg-black">
        {previewUrl ? (
          // Captured frame preview. The blob URL is created on this device.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="Captured photo" className="h-full w-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            className="h-full w-full object-cover"
            style={previewFacing === "user" ? { transform: "scaleX(-1)" } : undefined}
          />
        )}
      </div>
      <div className="grid gap-3 px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {cameraError && !previewUrl ? (
          <p className="text-sm text-amber-200" role="status">
            {cameraError}
          </p>
        ) : null}
        {message ? (
          <p className="text-sm text-emerald-300" role="status">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}
        {previewUrl ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setPhoto(null);
                setPreviewUrl((current) => {
                  if (current) {
                    URL.revokeObjectURL(current);
                  }
                  return null;
                });
              }}
              disabled={pending}
              className="h-12 rounded-full border-2 border-white text-sm font-bold"
            >
              Retake
            </button>
            <button
              type="button"
              onClick={upload}
              disabled={pending}
              className="h-12 rounded-full bg-white text-base font-bold text-stone-950 disabled:opacity-60"
            >
              {pending ? "Uploading…" : "Add to album"}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                const next = facingMode === "environment" ? "user" : "environment";
                setFacingMode(next);
                setPreviewFacing(next);
              }}
              className="h-12 rounded-full border-2 border-white px-4 text-sm font-bold text-white"
            >
              Flip
            </button>
            <button
              type="button"
              onClick={() => void takePhoto()}
              aria-label="Take photo"
              className="h-20 w-20 rounded-full border-4 border-white bg-white shadow-[0_0_0_6px_rgba(255,255,255,0.25)]"
            />
            <span className="w-16 text-center text-xs font-bold text-white">Snap</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="h-12 rounded-full border-2 border-white text-sm font-bold"
          >
            Upload Media
          </button>
          <button
            type="button"
            onClick={() => recordRef.current?.click()}
            className="h-12 rounded-full border-2 border-white text-sm font-bold"
          >
            Record Video
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="sr-only"
          onChange={(inputEvent) => {
            const file = inputEvent.target.files?.[0];
            inputEvent.target.value = "";
            if (file) {
              uploadPickedFile(file);
            }
          }}
        />
        <input
          ref={recordRef}
          type="file"
          accept="video/*"
          capture="environment"
          className="sr-only"
          onChange={(inputEvent) => {
            const file = inputEvent.target.files?.[0];
            inputEvent.target.value = "";
            if (file) {
              uploadPickedFile(file);
            }
          }}
        />
      </div>
    </main>
    </div>
  );
}
