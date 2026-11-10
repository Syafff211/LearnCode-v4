"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export const STORAGE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const STORAGE_IMAGE_SOURCE_MAX_BYTES = 15 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export type StorageUploadProgress = { loaded: number; total: number; percent: number };

function safeStem(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/g, "") || "learncode-image";
}

async function toOptimizedWebp(file: File): Promise<File> {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Pilih gambar JPG, PNG, WebP, atau AVIF.");
  }
  if (file.size === 0 || file.size > STORAGE_IMAGE_SOURCE_MAX_BYTES) {
    throw new Error("Ukuran gambar sumber maksimal 15 MB.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Browser tidak dapat membaca gambar ini. Coba JPG, PNG, atau WebP.");
  }

  const maxDimension = 1920;
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    bitmap.close();
    throw new Error("Browser tidak dapat menyiapkan gambar untuk diunggah.");
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const encode = (quality: number) =>
    new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) reject(new Error("Gambar gagal dikompres."));
        else resolve(blob);
      }, "image/webp", quality);
    });

  let blob = await encode(0.84);
  if (blob.type !== "image/webp") {
    throw new Error("Browser ini tidak mendukung ekspor WebP. Gunakan browser modern.");
  }
  if (blob.size > STORAGE_IMAGE_MAX_BYTES) blob = await encode(0.72);
  if (blob.size > STORAGE_IMAGE_MAX_BYTES) {
    throw new Error("Gambar masih melebihi 5 MB setelah dikompres. Pilih gambar yang lebih kecil.");
  }

  const base = safeStem(file.name.replace(/\.[^.]+$/, ""));
  return new File([blob], `${base}.webp`, { type: "image/webp", lastModified: Date.now() });
}

function uploadWithProgress(
  file: File,
  bucket: string,
  path: string,
  accessToken: string,
  onProgress: (progress: StorageUploadProgress) => void,
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!baseUrl || !anonKey) return Promise.reject(new Error("Supabase Storage belum dikonfigurasi pada browser."));

  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const request = new XMLHttpRequest();
  return new Promise((resolve, reject) => {
    request.open("POST", `${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`);
    request.setRequestHeader("apikey", anonKey);
    request.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    request.setRequestHeader("Content-Type", file.type);
    request.setRequestHeader("cache-control", "31536000");
    request.setRequestHeader("x-upsert", "false");
    request.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) return;
      onProgress({
        loaded: event.loaded,
        total: event.total,
        percent: Math.min(100, Math.round((event.loaded / event.total) * 100)),
      });
    });
    request.addEventListener("load", () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress({ loaded: file.size, total: file.size, percent: 100 });
        resolve();
        return;
      }
      let message = "Unggah gagal. Pastikan bucket blog-covers atau promotion-assets sudah dibuat dan akun memiliki akses admin.";
      try {
        const payload = JSON.parse(request.responseText) as { message?: string; error?: string };
        if (payload.message) message = payload.message;
        else if (payload.error) message = payload.error;
      } catch {
        // Keep the safe, generic message when the storage response is not JSON.
      }
      reject(new Error(message));
    });
    request.addEventListener("error", () => reject(new Error("Koneksi ke Supabase Storage terputus saat mengunggah.")));
    request.addEventListener("abort", () => reject(new Error("Unggah dibatalkan.")));
    request.send(file);
  });
}

export async function uploadOptimizedStorageImage({
  bucket,
  folder,
  file,
  onProgress,
}: {
  bucket: "blog-covers" | "promotion-assets";
  folder: string;
  file: File;
  onProgress: (progress: StorageUploadProgress) => void;
}): Promise<{ path: string; publicUrl: string }> {
  const client = createSupabaseBrowserClient();
  if (!client) throw new Error("Supabase belum dikonfigurasi pada browser.");
  const { data, error } = await client.auth.getSession();
  if (error || !data.session?.access_token || !data.session.user.id) {
    throw new Error("Sesi admin tidak ditemukan. Masuk kembali lalu coba lagi.");
  }

  const optimized = await toOptimizedWebp(file);
  const stem = safeStem(folder);
  const uuid = crypto.randomUUID();
  const path = `${data.session.user.id}/${stem}-${uuid}.webp`;
  await uploadWithProgress(optimized, bucket, path, data.session.access_token, onProgress);
  const { data: publicData } = client.storage.from(bucket).getPublicUrl(path);
  return { path, publicUrl: publicData.publicUrl };
}
