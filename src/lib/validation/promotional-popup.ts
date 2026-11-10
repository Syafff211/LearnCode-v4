import { z } from "zod";

import {
  PROMOTION_AUDIENCES,
  PROMOTION_FREQUENCIES,
  PROMOTION_PAGE_TARGETS,
  PROMOTION_POSITIONS,
  PROMOTION_SIZES,
  PROMOTION_TYPES,
  isSafePromotionUrl,
} from "@/lib/promotional-popup";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STORAGE_PATH_PATTERN = /^[0-9a-f-]{36}\/[a-z0-9]+(?:-[a-z0-9]+)*-[0-9a-f-]{36}\.webp$/i;
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

const emptyText = (max: number) => z.string().trim().max(max).default("");

const customPathSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .refine((path) => {
    if (!path.startsWith("/") || path.startsWith("//") || /[?#\\\s]/.test(path)) return false;
    if (path.includes("..")) return false;
    return /^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*\/?)?(?:\/\*)?$/i.test(path);
  }, "Path khusus harus berupa path lokal, mis. /promo atau /kursus/*.");

export const promotionalPopupInputSchema = z
  .object({
    internalName: z.string().trim().min(3, "Nama internal minimal 3 karakter.").max(100),
    title: z.string().trim().min(3, "Judul minimal 3 karakter.").max(120),
    description: z.string().trim().max(1200).default(""),
    imagePath: z
      .string()
      .trim()
      .max(260)
      .refine((path) => path === "" || STORAGE_PATH_PATTERN.test(path), "Gambar harus berasal dari bucket Supabase Storage yang diunggah oleh admin."),
    imageAlt: emptyText(180),
    primaryButtonText: emptyText(60),
    primaryButtonUrl: emptyText(2048).refine(isSafePromotionUrl, "URL tombol utama harus berupa path lokal atau URL HTTP(S) yang valid."),
    secondaryButtonText: emptyText(60),
    secondaryButtonUrl: emptyText(2048).refine(isSafePromotionUrl, "URL tombol sekunder harus berupa path lokal atau URL HTTP(S) yang valid."),
    backgroundColor: z.string().trim().regex(HEX_COLOR_PATTERN, "Gunakan warna HEX, mis. #faf9f5."),
    textColor: z.string().trim().regex(HEX_COLOR_PATTERN, "Gunakan warna HEX, mis. #25251f."),
    buttonColor: z.string().trim().regex(HEX_COLOR_PATTERN, "Gunakan warna HEX, mis. #a8d35b."),
    buttonTextColor: z.string().trim().regex(HEX_COLOR_PATTERN, "Gunakan warna HEX, mis. #1a2012."),
    position: z.enum(PROMOTION_POSITIONS),
    size: z.enum(PROMOTION_SIZES),
    backdropClose: z.boolean(),
    popupType: z.enum(PROMOTION_TYPES),
    frequency: z.enum(PROMOTION_FREQUENCIES),
    audience: z.enum(PROMOTION_AUDIENCES),
    priority: z.number().int().min(0).max(10000),
    isActive: z.boolean(),
    isPrimary: z.boolean(),
    startsAt: z.string().trim().max(16).default(""),
    endsAt: z.string().trim().max(16).default(""),
    pageTargets: z.array(z.enum(PROMOTION_PAGE_TARGETS)).min(1, "Pilih minimal satu target halaman.").max(10),
    customPaths: z.array(customPathSchema).max(20),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.imagePath && value.imageAlt.length < 5) {
      ctx.addIssue({
        code: "custom",
        path: ["imageAlt"],
        message: "Tulis alt text yang menjelaskan gambar (minimal 5 karakter).",
      });
    }
    if (!value.imagePath && value.imageAlt) {
      ctx.addIssue({
        code: "custom",
        path: ["imageAlt"],
        message: "Alt text hanya dapat diisi jika gambar sudah diunggah.",
      });
    }
    if (Boolean(value.primaryButtonText) !== Boolean(value.primaryButtonUrl)) {
      ctx.addIssue({
        code: "custom",
        path: [value.primaryButtonText ? "primaryButtonUrl" : "primaryButtonText"],
        message: "Isi label dan URL tombol utama, atau kosongkan keduanya.",
      });
    }
    if (Boolean(value.secondaryButtonText) !== Boolean(value.secondaryButtonUrl)) {
      ctx.addIssue({
        code: "custom",
        path: [value.secondaryButtonText ? "secondaryButtonUrl" : "secondaryButtonText"],
        message: "Isi label dan URL tombol sekunder, atau kosongkan keduanya.",
      });
    }
    if (!value.primaryButtonUrl && !value.secondaryButtonUrl && value.popupType === "promotion") {
      ctx.addIssue({
        code: "custom",
        path: ["primaryButtonText"],
        message: "Popup promosi perlu minimal satu tombol ajakan.",
      });
    }
    if (value.frequency === "once_per_user" && value.audience !== "authenticated") {
      ctx.addIssue({
        code: "custom",
        path: ["audience"],
        message: "Frekuensi sekali per akun hanya tersedia untuk pengguna yang sudah masuk.",
      });
    }
    if (value.pageTargets.includes("custom") && value.customPaths.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["customPaths"],
        message: "Tambahkan minimal satu path khusus.",
      });
    }
    if (!value.pageTargets.includes("custom") && value.customPaths.length > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["pageTargets"],
        message: "Pilih target Path khusus atau hapus daftar path.",
      });
    }
    if (value.startsAt && !isValidUtcDateTime(value.startsAt)) {
      ctx.addIssue({ code: "custom", path: ["startsAt"], message: "Tanggal mulai tidak valid." });
    }
    if (value.endsAt && !isValidUtcDateTime(value.endsAt)) {
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "Tanggal akhir tidak valid." });
    }
    if (value.startsAt && value.endsAt && isValidUtcDateTime(value.startsAt) && isValidUtcDateTime(value.endsAt)) {
      if (new Date(`${value.endsAt}:00Z`).getTime() <= new Date(`${value.startsAt}:00Z`).getTime()) {
        ctx.addIssue({ code: "custom", path: ["endsAt"], message: "Tanggal akhir harus setelah tanggal mulai." });
      }
    }
  });

function isValidUtcDateTime(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 16) === value;
}

export type PromotionalPopupInput = z.infer<typeof promotionalPopupInputSchema>;

export function parsePromotionalPopupForm(formData: FormData) {
  const read = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : "";
  };
  const pageTargets = formData
    .getAll("pageTargets")
    .filter((value): value is string => typeof value === "string");
  const customPaths = read("customPaths")
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);
  const checkbox = (key: string) => formData.get(key) === "on" || formData.get(key) === "true";
  const priority = Number(read("priority"));

  return promotionalPopupInputSchema.safeParse({
    internalName: read("internalName"),
    title: read("title"),
    description: read("description"),
    imagePath: read("imagePath"),
    imageAlt: read("imageAlt"),
    primaryButtonText: read("primaryButtonText"),
    primaryButtonUrl: read("primaryButtonUrl"),
    secondaryButtonText: read("secondaryButtonText"),
    secondaryButtonUrl: read("secondaryButtonUrl"),
    backgroundColor: read("backgroundColor"),
    textColor: read("textColor"),
    buttonColor: read("buttonColor"),
    buttonTextColor: read("buttonTextColor"),
    position: read("position"),
    size: read("size"),
    backdropClose: checkbox("backdropClose"),
    popupType: read("popupType"),
    frequency: read("frequency"),
    audience: read("audience"),
    priority,
    isActive: checkbox("isActive"),
    isPrimary: checkbox("isPrimary"),
    startsAt: read("startsAt"),
    endsAt: read("endsAt"),
    pageTargets,
    customPaths,
  });
}

export function promotionalPopupIdSchema(value: string) {
  return z.string().regex(UUID_PATTERN).safeParse(value);
}

export function promotionalPopupStatusSchema(value: string) {
  return z.enum(["active", "inactive", "scheduled", "expired"]).safeParse(value);
}
