import { z } from "zod";

import { slugSchema } from "@/lib/validation/admin";

export const BLOG_PAGE_SIZE = 20;
export const blogPostStatusSchema = z.enum(["draft", "published", "archived"]);
export type BlogPostStatus = z.infer<typeof blogPostStatusSchema>;

const BLOG_COVER_PATH_PATTERN = /^[0-9a-f-]{36}\/[a-z0-9]+(?:-[a-z0-9]+)*-[0-9a-f-]{36}\.webp$/i;

function validCalendarDate(value: string): boolean {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

const optionalText = (max: number) =>
  z.string().trim().max(max).default("");

export const blogPostInputSchema = z
  .object({
    title: z.string().trim().min(5, "Judul minimal 5 karakter.").max(160, "Judul maksimal 160 karakter."),
    slug: slugSchema,
    excerpt: z
      .string()
      .trim()
      .min(40, "Ringkasan minimal 40 karakter.")
      .max(320, "Ringkasan maksimal 320 karakter."),
    contentMd: z
      .string()
      .trim()
      .min(80, "Isi artikel minimal 80 karakter.")
      .max(40000, "Isi artikel maksimal 40000 karakter."),
    categoryId: z.uuid("Pilih kategori artikel yang valid."),
    authorName: optionalText(80).transform((value) => value || "LearnCode"),
    coverImagePath: z
      .string()
      .trim()
      .max(260, "Path gambar cover terlalu panjang.")
      .refine((path) => path === "" || BLOG_COVER_PATH_PATTERN.test(path), "Cover harus berasal dari bucket blog-covers yang diunggah oleh admin."),
    coverImageAlt: optionalText(180),
    seoTitle: optionalText(90),
    seoDescription: optionalText(170),
    publishedDate: z
      .string()
      .trim()
      .max(10)
      .refine(validCalendarDate, "Tanggal publikasi tidak valid."),
    relatedCourseId: z
      .string()
      .trim()
      .refine((value) => value === "" || z.uuid().safeParse(value).success, "Kursus terkait tidak valid."),
    status: blogPostStatusSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.coverImagePath && value.coverImageAlt.length < 5) {
      ctx.addIssue({
        code: "custom",
        path: ["coverImageAlt"],
        message: "Tulis teks alternatif yang menjelaskan cover (minimal 5 karakter).",
      });
    }
    if (!value.coverImagePath && value.coverImageAlt) {
      ctx.addIssue({
        code: "custom",
        path: ["coverImageAlt"],
        message: "Unggah cover terlebih dahulu atau kosongkan teks alternatif.",
      });
    }
  });

export type BlogPostInput = z.infer<typeof blogPostInputSchema>;

export function parseBlogPostForm(formData: FormData) {
  const read = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : "";
  };
  return blogPostInputSchema.safeParse({
    title: read("title"),
    slug: read("slug"),
    excerpt: read("excerpt"),
    contentMd: read("contentMd"),
    categoryId: read("categoryId"),
    authorName: read("authorName"),
    coverImagePath: read("coverImagePath"),
    coverImageAlt: read("coverImageAlt"),
    seoTitle: read("seoTitle"),
    seoDescription: read("seoDescription"),
    publishedDate: read("publishedDate"),
    relatedCourseId: read("relatedCourseId"),
    status: read("status"),
  });
}

/** Publishing checks that keep the public feed substantive rather than thin. */
export function blogPublishBlockers(input: BlogPostInput): string[] {
  const blockers: string[] = [];
  const words = input.contentMd.trim().split(/\s+/).filter(Boolean).length;
  const headings = input.contentMd.match(/^#{2,3}\s+\S.+$/gm) ?? [];
  if (input.contentMd.length < 1200) blockers.push("Lengkapi artikel hingga minimal 1200 karakter sebelum diterbitkan.");
  if (words < 250) blockers.push("Artikel perlu sedikitnya 250 kata agar cukup membantu pembaca.");
  if (headings.length < 2) blockers.push("Tambahkan minimal dua subjudul Markdown agar artikel mudah dipindai.");
  if (input.excerpt.length < 60) blockers.push("Ringkasan perlu sedikitnya 60 karakter.");
  if (!input.coverImagePath || input.coverImageAlt.trim().length < 5) {
    blockers.push("Unggah cover WebP dan isi alt text yang deskriptif sebelum menerbitkan artikel.");
  }
  return blockers;
}

export const blogAdminQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(80)
    .regex(/^[\p{L}\p{N}\s-]*$/u, "Pencarian hanya boleh berisi huruf, angka, spasi, dan tanda hubung.")
    .default(""),
  status: z.enum(["all", "draft", "published", "archived"]).default("all"),
  categoryId: z.string().trim().default(""),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});

export type BlogAdminQuery = z.infer<typeof blogAdminQuerySchema>;
