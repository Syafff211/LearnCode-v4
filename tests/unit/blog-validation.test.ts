import { describe, expect, it } from "vitest";

import { blogPostInputSchema, blogPublishBlockers } from "@/lib/validation/blog";

const longContent = [
  "## Konsep pertama",
  Array.from({ length: 145 }, (_, index) => `penjelasan${index} membantu memahami konsep dan alasan di balik pilihan kode.`).join(" "),
  "## Langkah praktik",
  Array.from({ length: 145 }, (_, index) => `latihan${index} menguji perilaku pada kondisi normal dan batas yang berbeda.`).join(" "),
].join("\n\n");

const validPost = {
  title: "Panduan praktik untuk belajar coding",
  slug: "panduan-praktik-belajar-coding",
  excerpt: "Panduan ini menjelaskan konsep dengan langkah praktik dan pemeriksaan hasil yang jelas.",
  contentMd: longContent,
  categoryId: "00000000-0000-4000-8000-000000000001",
  authorName: "LearnCode",
  coverImagePath: "00000000-0000-4000-8000-000000000002/panduan-praktik-00000000-0000-4000-8000-000000000003.webp",
  coverImageAlt: "Ilustrasi editor kode untuk panduan praktik",
  seoTitle: "Panduan praktik coding",
  seoDescription: "Panduan belajar coding dengan konsep, langkah praktik, dan pemeriksaan hasil.",
  publishedDate: "2026-10-17",
  relatedCourseId: "",
  status: "published",
};

describe("blog publishing validation", () => {
  it("accepts a substantive post and does not invent missing author data", () => {
    const parsed = blogPostInputSchema.safeParse({ ...validPost, authorName: "" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.authorName).toBe("LearnCode");
      expect(blogPublishBlockers(parsed.data)).toEqual([]);
    }
  });

  it("requires a Storage WebP path and rejects impossible publication dates", () => {
    expect(
      blogPostInputSchema.safeParse({
        ...validPost,
        coverImagePath: "https://example.com/cover.webp",
      }).success,
    ).toBe(false);
    expect(blogPostInputSchema.safeParse({ ...validPost, publishedDate: "2026-02-30" }).success).toBe(false);
  });

  it("allows a draft without a cover but blocks publishing it", () => {
    const parsed = blogPostInputSchema.safeParse({
      ...validPost,
      coverImagePath: "",
      coverImageAlt: "",
      status: "draft",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(blogPublishBlockers(parsed.data)).toContain(
      "Unggah cover WebP dan isi alt text yang deskriptif sebelum menerbitkan artikel.",
    );
  });

  it("blocks thin posts from publication", () => {
    const parsed = blogPostInputSchema.safeParse({
      ...validPost,
      contentMd: `## Satu\n\n${"Penjelasan singkat tentang konsep dan praktik. ".repeat(6)}\n\n## Dua\n\n${"Langkah berikutnya tetap membutuhkan contoh yang lebih lengkap. ".repeat(6)}`,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(blogPublishBlockers(parsed.data).length).toBeGreaterThan(0);
  });
});
