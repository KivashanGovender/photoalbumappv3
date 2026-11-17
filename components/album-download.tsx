"use client";

import { useState } from "react";
import { toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";
import type { RefObject } from "react";
import { secondaryButton } from "@/components/ui";

function keepInExport(node: HTMLElement) {
  if (node.dataset.albumExport === "ignore" || node.dataset.exportIgnore === "true") {
    return false;
  }

  const tag = node.tagName;
  return tag !== "BUTTON" && tag !== "VIDEO" && tag !== "A" && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT";
}

function videoFrame(video: HTMLVideoElement) {
  if (video.videoWidth > 0 && video.readyState >= 2) {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");

    if (context) {
      try {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", 0.92);
      } catch {
        // A tainted frame falls through to the poster or placeholder.
      }
    }
  }

  return video.getAttribute("poster") || "";
}

function videoPlaceholder() {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 800;
  const context = canvas.getContext("2d");

  if (!context) {
    return "";
  }

  context.fillStyle = "#d6d3d1";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#44403c";
  context.font = "600 28px sans-serif";
  context.textAlign = "center";
  context.fillText("Video", canvas.width / 2, canvas.height / 2);
  return canvas.toDataURL("image/jpeg", 0.8);
}

async function showVideoStills(root: HTMLElement) {
  const restores: Array<() => void> = [];
  const loads: Array<Promise<void>> = [];

  for (const video of root.querySelectorAll("video")) {
    const still = document.createElement("img");
    still.alt = "Video preview";
    still.crossOrigin = "anonymous";
    still.className = video.className;
    still.src = videoFrame(video) || videoPlaceholder();
    loads.push(still.decode().catch(() => undefined));
    video.insertAdjacentElement("beforebegin", still);
    const previousDisplay = video.style.display;
    video.style.display = "none";
    restores.push(() => {
      still.remove();
      video.style.display = previousDisplay;
    });
  }

  await Promise.all(loads);

  return () => {
    for (const restore of restores) {
      restore();
    }
  };
}

async function captureAlbum(node: HTMLElement) {
  const restoreVideos = await showVideoStills(node);

  try {
    return await toJpeg(node, {
      quality: 0.95,
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: "#ffffff",
      filter: (domNode) => !(domNode instanceof HTMLElement) || keepInExport(domNode),
    });
  } finally {
    restoreVideos();
  }
}

function downloadUrl(href: string, filename: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  link.click();
}

async function jpegSize(dataUrl: string) {
  const image = new Image();
  image.src = dataUrl;
  await image.decode();
  return { width: image.naturalWidth, height: image.naturalHeight };
}

export function AlbumDownload({
  slug,
  albumRef,
}: {
  slug: string;
  albumRef: RefObject<HTMLDivElement | null>;
}) {
  const [pending, setPending] = useState<"jpg" | "pdf" | null>(null);
  const [error, setError] = useState("");

  async function exportJpg() {
    const node = albumRef.current;
    if (!node || pending) {
      return;
    }

    setPending("jpg");
    setError("");

    try {
      const dataUrl = await captureAlbum(node);
      downloadUrl(dataUrl, `${slug}-album.jpg`);
    } catch {
      setError("The JPG could not be created. Try again once the photos have loaded.");
    } finally {
      setPending(null);
    }
  }

  async function exportPdf() {
    const node = albumRef.current;
    if (!node || pending) {
      return;
    }

    setPending("pdf");
    setError("");

    try {
      const dataUrl = await captureAlbum(node);
      const { width, height } = await jpegSize(dataUrl);
      const pageWidth = 210;
      const pageHeight = 297;
      const imageHeight = (height * pageWidth) / width;
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      let remaining = imageHeight;
      let offset = 0;

      pdf.addImage(dataUrl, "JPEG", 0, offset, pageWidth, imageHeight);
      remaining -= pageHeight;

      while (remaining > 1) {
        offset -= pageHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, "JPEG", 0, offset, pageWidth, imageHeight);
        remaining -= pageHeight;
      }

      pdf.save(`${slug}-album.pdf`);
    } catch {
      setError("The PDF could not be created. Try again once the photos have loaded.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-album-export="ignore">
      <button type="button" onClick={() => void exportJpg()} disabled={pending !== null} className={secondaryButton}>
        {pending === "jpg" ? "Exporting JPG..." : "Download as JPG"}
      </button>
      <button type="button" onClick={() => void exportPdf()} disabled={pending !== null} className={secondaryButton}>
        {pending === "pdf" ? "Generating PDF..." : "Download as PDF"}
      </button>
      {error ? (
        <p className="w-full text-sm font-semibold text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
