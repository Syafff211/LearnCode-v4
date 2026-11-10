"use client";

import Image from "next/image";
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  uploadOptimizedStorageImage,
  type StorageUploadProgress,
} from "@/lib/storage-upload";

export function StorageImageUpload({
  bucket,
  id,
  name,
  label,
  fileNameBase,
  path,
  publicUrl,
  altText,
  helper,
  error,
  onChange,
}: {
  bucket: "blog-covers" | "promotion-assets";
  id: string;
  name: string;
  label: string;
  fileNameBase: string;
  path: string;
  publicUrl: string;
  altText: string;
  helper: string;
  error?: string[];
  onChange: (path: string, publicUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [progress, setProgress] = useState<StorageUploadProgress | null>(null);

  async function handleFile(file?: File) {
    if (!file) return;
    setBusy(true);
    setUploadError("");
    setProgress({ loaded: 0, total: 0, percent: 0 });
    try {
      const result = await uploadOptimizedStorageImage({
        bucket,
        folder: fileNameBase,
        file,
        onProgress: setProgress,
      });
      onChange(result.path, result.publicUrl);
      setProgress({ loaded: 1, total: 1, percent: 100 });
    } catch (cause) {
      setUploadError(cause instanceof Error ? cause.message : "Gambar gagal diunggah.");
      setProgress(null);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={path} />
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[7px] border border-line bg-surface-2">
        {publicUrl ? (
          <Image
            src={publicUrl}
            alt={altText || label}
            fill
            sizes="(max-width: 768px) 100vw, 600px"
            className="object-contain"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center px-5 text-center">
            <div>
              <ImagePlus className="mx-auto size-6 text-muted" aria-hidden="true" />
              <p className="mt-2 text-xs text-muted">{label} belum diunggah</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          disabled={busy}
          aria-label={`Unggah ${label}`}
          aria-describedby={`${id}-help ${id}-error`}
          onChange={(event) => void handleFile(event.currentTarget.files?.[0])}
          className="block min-w-0 flex-1 text-xs text-muted file:mr-3 file:min-h-9 file:rounded-[5px] file:border file:border-line-strong file:bg-surface file:px-3 file:text-xs file:font-medium file:text-ink-soft hover:file:bg-surface-2 disabled:opacity-60"
        />
        {path ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => {
              onChange("", "");
              setUploadError("");
              setProgress(null);
            }}
          >
            <Trash2 aria-hidden="true" /> Hapus gambar
          </Button>
        ) : null}
      </div>
      <p id={`${id}-help`} className="text-[11px] leading-relaxed text-muted">{helper}</p>
      {busy && progress ? (
        <div className="flex items-center gap-2" aria-live="polite">
          <LoaderCircle className="size-3.5 animate-spin text-accent-text" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex justify-between gap-3 text-[10px] text-muted">
              <span>Mengunggah gambar WebP…</span>
              <span>{progress.percent}%</span>
            </div>
            <progress
              className="storage-upload-progress block h-1.5 w-full overflow-hidden rounded-full"
              max={100}
              value={progress.percent}
              aria-label="Progres unggah gambar"
              aria-valuetext={`${progress.percent}%`}
            />
          </div>
        </div>
      ) : null}
      {uploadError ? <p id={`${id}-error`} className="text-xs text-danger-text" role="alert">{uploadError}</p> : null}
      {!uploadError && error?.length ? <p id={`${id}-error`} className="text-xs text-danger-text" role="alert">{error[0]}</p> : null}
    </div>
  );
}
