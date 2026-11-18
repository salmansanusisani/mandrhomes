"use client";

import Image from "next/image";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Link2, Loader2, Trash2, Upload } from "lucide-react";

const MAX_IMAGES = 8;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_BYTES = 28 * 1024 * 1024;

export function ProductImagesField({
  initialImages,
  error,
}: {
  initialImages: string[];
  error?: string;
}) {
  const [images, setImages] = useState(initialImages.slice(0, MAX_IMAGES));
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: File[]) {
    if (files.length === 0) return;

    const accepted: File[] = [];
    let nextError: string | null = null;

    for (const file of files) {
      if (images.length + accepted.length >= MAX_IMAGES) {
        nextError = `You can add up to ${MAX_IMAGES} images.`;
        break;
      }
      if (file.size > MAX_FILE_BYTES) {
        nextError = `${file.name} is larger than 8MB.`;
        continue;
      }
      if (!file.type.startsWith("image/")) {
        nextError = `${file.name} is not an image.`;
        continue;
      }
      accepted.push(file);
    }

    const totalBytes = accepted.reduce((total, file) => total + file.size, 0);
    if (totalBytes > MAX_TOTAL_BYTES) {
      setLocalError("Those images are too large together. Please upload fewer or smaller files.");
      return;
    }
    if (accepted.length === 0) {
      setLocalError(nextError);
      return;
    }

    setUploading(true);
    setLocalError(null);
    try {
      const body = new FormData();
      accepted.forEach((file) => body.append("files", file));
      const response = await fetch("/api/admin/product-images", { method: "POST", body });
      const result = (await response.json().catch(() => ({}))) as { urls?: string[]; error?: string };
      if (!response.ok || !result.urls?.length) {
        throw new Error(result.error || "Could not upload the images.");
      }
      setImages((current) => [...current, ...result.urls!].slice(0, MAX_IMAGES));
      if (nextError) setLocalError(nextError);
    } catch (uploadError) {
      setLocalError(uploadError instanceof Error ? uploadError.message : "Could not upload the images.");
    } finally {
      setUploading(false);
    }
  }

  function handleSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    void uploadFiles(files);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void uploadFiles(Array.from(event.dataTransfer.files));
  }

  function moveImage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    setImages((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function addUrl() {
    const value = url.trim();
    if (!value) return;
    if (!value.startsWith("/") && !/^https?:\/\//.test(value)) {
      setLocalError("Enter a full image URL starting with https:// or a path starting with /.");
      return;
    }
    if (images.includes(value)) {
      setLocalError("That image has already been added.");
      return;
    }
    if (images.length >= MAX_IMAGES) {
      setLocalError(`You can add up to ${MAX_IMAGES} images.`);
      return;
    }
    setImages((current) => [...current, value]);
    setUrl("");
    setLocalError(null);
  }

  const shownError = localError ?? error;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="label mb-0">Product images</label>
        <span className="text-[11px] text-muted">{images.length} of {MAX_IMAGES}</span>
      </div>

      <input type="hidden" name="images" value={images.join("\n")} />

      <div
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
          setDragging(false);
        }}
        onDrop={handleDrop}
        className={`mt-2 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-5 py-7 text-center transition ${
          dragging ? "border-brand bg-brand-soft/60" : "border-sand-strong bg-cream/50"
        }`}
      >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-brand shadow-sm">
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
        </span>
        <div>
          <p className="text-sm font-semibold">{uploading ? "Uploading images…" : "Add images from your device"}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            Drag and drop photos here, or choose multiple files. JPG, PNG, WebP, AVIF or GIF · up to 8MB each.
          </p>
        </div>
        <button
          type="button"
          disabled={uploading || images.length >= MAX_IMAGES}
          onClick={() => inputRef.current?.click()}
          className="btn-outline btn-sm"
        >
          <Upload className="h-3.5 w-3.5" /> Choose from device
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,image/gif"
          multiple
          className="sr-only"
          onChange={handleSelection}
        />
      </div>

      <div className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addUrl();
              }
            }}
            className="input pl-9"
            placeholder="Or paste an image URL"
            aria-label="Add an image URL"
          />
        </div>
        <button type="button" onClick={addUrl} className="btn-outline btn-sm shrink-0">Add URL</button>
      </div>

      {shownError && <p className="mt-2 text-xs text-rose-600">{shownError}</p>}

      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((image, index) => (
            <div key={`${image}-${index}`} className="group relative aspect-square overflow-hidden rounded-xl border border-sand bg-sand">
              <Image
                src={image}
                alt=""
                fill
                sizes="(min-width: 640px) 180px, 45vw"
                className="object-cover"
              />
              {index === 0 && (
                <span className="absolute left-2 top-2 rounded-full bg-brand-dark/80 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                  Main
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-brand-dark/80 p-1.5 opacity-100 backdrop-blur-sm sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => moveImage(index, -1)}
                  disabled={index === 0}
                  className="grid h-7 w-7 place-items-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white disabled:opacity-30"
                  aria-label="Move image left"
                  title="Move left"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(index, 1)}
                  disabled={index === images.length - 1}
                  className="grid h-7 w-7 place-items-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white disabled:opacity-30"
                  aria-label="Move image right"
                  title="Move right"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  className="grid h-7 w-7 place-items-center rounded-full text-white/80 transition hover:bg-rose-500/80 hover:text-white"
                  aria-label="Remove image"
                  title="Remove image"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-2 text-[11px] text-muted">The first image is the main product image. Uploaded photos are optimised automatically.</p>
    </div>
  );
}
