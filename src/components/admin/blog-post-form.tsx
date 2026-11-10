"use client";

import { useActionState, useMemo, useState } from "react";
import type { FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Eye, PencilLine, Save } from "lucide-react";

import { FormField, FormMessage } from "@/components/admin/primitives";
import { StorageImageUpload } from "@/components/admin/storage-image-upload";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { IDLE_ADMIN_STATE, type AdminActionState } from "@/lib/actions/admin-state";
import type { BlogCategory } from "@/lib/data/blog";
import { blogPublishBlockers, parseBlogPostForm } from "@/lib/validation/blog";

type BlogPostInitial = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content_md: string;
  category_id: string;
  author_name: string | null;
  cover_image_path: string | null;
  cover_image: string | null;
  cover_image_alt: string | null;
  status: string;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  related_course_id: string | null;
};

type BlogFormAction = (
  state: AdminActionState,
  formData: FormData,
) => Promise<AdminActionState>;

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function BlogPostForm({
  action,
  categories,
  courses,
  post,
}: {
  action: BlogFormAction;
  categories: BlogCategory[];
  courses: { id: string; title: string; slug: string }[];
  post?: BlogPostInitial;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_ADMIN_STATE);
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content_md ?? "");
  const [preview, setPreview] = useState(false);
  const [status, setStatus] = useState(post?.status ?? "draft");
  const [coverImagePath, setCoverImagePath] = useState(post?.cover_image_path ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(post?.cover_image ?? "");
  const [coverImageAlt, setCoverImageAlt] = useState(post?.cover_image_alt ?? "");
  const [clientError, setClientError] = useState("");
  const errors = state.fieldErrors ?? {};
  const wordCount = useMemo(
    () => content.trim().split(/\s+/).filter(Boolean).length,
    [content],
  );

  function validateBeforeSubmit(event: FormEvent<HTMLFormElement>) {
    const parsed = parseBlogPostForm(new FormData(event.currentTarget));
    if (!parsed.success) {
      event.preventDefault();
      setClientError(parsed.error.issues[0]?.message ?? "Periksa kembali data artikel.");
      return;
    }
    if (parsed.data.status === "published") {
      const [blocker] = blogPublishBlockers(parsed.data);
      if (blocker) {
        event.preventDefault();
        setClientError(blocker);
        return;
      }
    }
    setClientError("");
  }

  return (
    <form action={formAction} className="space-y-4" noValidate onSubmit={validateBeforeSubmit} onChange={() => { if (clientError) setClientError(""); }}>
      {post ? <input type="hidden" name="postId" value={post.id} /> : null}

      <section className="rounded-[8px] border border-line bg-surface p-4 sm:p-5" aria-labelledby="blog-basic-heading">
        <div className="mb-4 border-b border-line pb-3">
          <h2 id="blog-basic-heading" className="font-display text-base font-semibold text-ink">Informasi artikel</h2>
          <p className="mt-0.5 text-[11px] text-muted">Judul, URL, kategori, penulis, dan status publikasi.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Judul artikel" htmlFor="title" error={errors.title} className="sm:col-span-2">
            <Input
              id="title"
              name="title"
              value={title}
              onChange={(event) => {
                const value = event.target.value;
                setTitle(value);
                if (!slugTouched) setSlug(slugify(value));
              }}
              required
              maxLength={160}
              aria-invalid={Boolean(errors.title?.length)}
            />
          </FormField>
          <FormField
            label="Slug URL"
            htmlFor="slug"
            error={errors.slug}
            hint="URL publik: /blog/<slug>. Slug harus unik dan hanya memakai huruf kecil, angka, atau tanda hubung."
          >
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(slugify(event.target.value));
              }}
              required
              maxLength={80}
              className="font-mono text-[0.8125rem]"
              aria-invalid={Boolean(errors.slug?.length)}
            />
          </FormField>
          <FormField label="Kategori" htmlFor="categoryId" error={errors.categoryId}>
            <Select id="categoryId" name="categoryId" defaultValue={post?.category_id ?? ""} required>
              <option value="" disabled>Pilih kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </Select>
          </FormField>
          <FormField
            label="Penulis"
            htmlFor="authorName"
            error={errors.authorName}
            hint="Gunakan identitas yang benar. Jika dikosongkan, artikel tampil atas nama LearnCode."
          >
            <Input id="authorName" name="authorName" defaultValue={post?.author_name ?? "LearnCode"} maxLength={80} />
          </FormField>
          <FormField label="Status" htmlFor="status" error={errors.status}>
            <Select id="status" name="status" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="draft">Draft</option>
              <option value="published">Terbit</option>
              <option value="archived">Arsip</option>
            </Select>
          </FormField>
          <FormField
            label="Tanggal publikasi"
            htmlFor="publishedDate"
            error={errors.publishedDate}
            hint="Tanggal tersimpan sebagai tanggal kalender; artikel terbit hanya setelah tanggalnya tercapai."
          >
            <Input
              id="publishedDate"
              name="publishedDate"
              type="date"
              defaultValue={post?.published_at?.slice(0, 10) ?? ""}
            />
          </FormField>
          <FormField
            label="Kursus terkait"
            htmlFor="relatedCourseId"
            error={errors.relatedCourseId}
            hint="Opsional. Hanya kursus LearnCode yang sedang terbit yang dapat dipilih."
            className="sm:col-span-2"
          >
            <Select id="relatedCourseId" name="relatedCourseId" defaultValue={post?.related_course_id ?? ""}>
              <option value="">Tidak ada</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title} · {course.slug}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Ringkasan" htmlFor="excerpt" error={errors.excerpt} hint="Ditampilkan pada kartu artikel dan metadata jika deskripsi SEO dikosongkan." className="sm:col-span-2">
            <Textarea
              id="excerpt"
              name="excerpt"
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              rows={3}
              maxLength={320}
              required
              aria-invalid={Boolean(errors.excerpt?.length)}
            />
          </FormField>
        </div>
      </section>

      <section className="rounded-[8px] border border-line bg-surface p-4 sm:p-5" aria-labelledby="blog-content-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
          <div>
            <h2 id="blog-content-heading" className="font-display text-base font-semibold text-ink">Isi artikel</h2>
            <p className="mt-0.5 text-[11px] text-muted">Markdown didukung. HTML mentah dan URL berbahaya tidak dirender pada halaman publik.</p>
          </div>
          <div className="flex items-center gap-1 rounded-[6px] border border-line p-1" role="group" aria-label="Mode editor">
            <Button type="button" size="sm" variant={preview ? "ghost" : "secondary"} onClick={() => setPreview(false)} aria-pressed={!preview}>
              <PencilLine aria-hidden="true" /> Tulis
            </Button>
            <Button type="button" size="sm" variant={preview ? "secondary" : "ghost"} onClick={() => setPreview(true)} aria-pressed={preview}>
              <Eye aria-hidden="true" /> Pratinjau
            </Button>
          </div>
        </div>
        <FormField label="Konten Markdown" htmlFor="contentMd" error={errors.contentMd} hint={`${wordCount} kata · gunakan subjudul ## untuk struktur dan daftar isi.`}>
          {preview ? (
            <div className="min-h-72 rounded-[6px] border border-line-strong bg-canvas px-4 py-3">
              {content.trim() ? (
                <div className="prose-lc max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm text-muted">Tulis konten terlebih dahulu untuk melihat pratinjau.</p>
              )}
            </div>
          ) : (
            <Textarea
              id="contentMd"
              name="contentMd"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={24}
              required
              maxLength={40000}
              className="font-mono text-[0.8125rem] leading-relaxed"
              aria-invalid={Boolean(errors.contentMd?.length)}
            />
          )}
        </FormField>
        {preview ? <input type="hidden" name="contentMd" value={content} /> : null}
      </section>

      <section className="rounded-[8px] border border-line bg-surface p-4 sm:p-5" aria-labelledby="blog-cover-heading">
        <div className="mb-4 border-b border-line pb-3">
          <h2 id="blog-cover-heading" className="font-display text-base font-semibold text-ink">Cover dan metadata SEO</h2>
          <p className="mt-0.5 text-[11px] text-muted">Cover WebP wajib untuk artikel terbit. Draft boleh tanpa cover; setiap cover memerlukan alt text yang deskriptif.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Cover artikel"
            htmlFor="blog-cover-upload"
            error={errors.coverImagePath}
            hint={status === "published" ? "Wajib sebelum menerbitkan. Gambar diproses ke WebP dan diunggah ke Supabase Storage." : "Opsional selama artikel berstatus draft. Maksimal 5 MB sebelum optimasi."}
            className="sm:col-span-2"
          >
            <StorageImageUpload
              bucket="blog-covers"
              id="blog-cover-upload"
              name="coverImagePath"
              label="Cover artikel 16:9"
              fileNameBase={slug || title || "artikel"}
              path={coverImagePath}
              publicUrl={coverImageUrl}
              altText={coverImageAlt}
              helper="JPG, PNG, WebP, atau AVIF. File dikompresi dan disimpan sebagai WebP; cover 16:9 disarankan."
              error={errors.coverImagePath}
              onChange={(path, url) => {
                setCoverImagePath(path);
                setCoverImageUrl(url);
                if (!path) setCoverImageAlt("");
              }}
            />
          </FormField>
          <FormField label="Teks alternatif cover" htmlFor="coverImageAlt" error={errors.coverImageAlt} className="sm:col-span-2">
            <Input
              id="coverImageAlt"
              name="coverImageAlt"
              value={coverImageAlt}
              onChange={(event) => setCoverImageAlt(event.target.value)}
              maxLength={180}
              required={Boolean(coverImagePath) || status === "published"}
              placeholder="Contoh: Antarmuka editor kode dengan contoh HTML di layar"
            />
          </FormField>
          <FormField label="Judul SEO" htmlFor="seoTitle" error={errors.seoTitle} hint="Opsional; maksimal 90 karakter.">
            <Input id="seoTitle" name="seoTitle" defaultValue={post?.seo_title ?? ""} maxLength={90} />
          </FormField>
          <FormField label="Deskripsi SEO" htmlFor="seoDescription" error={errors.seoDescription} hint="Opsional; ringkasan artikel dipakai sebagai fallback.">
            <Textarea id="seoDescription" name="seoDescription" defaultValue={post?.seo_description ?? ""} rows={3} maxLength={170} />
          </FormField>
        </div>
      </section>

      {clientError ? <FormMessage status="error" message={clientError} /> : null}
      <FormMessage status={state.status} message={state.message} />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="max-w-xl text-[11px] leading-relaxed text-muted">
          Artikel terbit harus berisi minimal 250 kata, 1200 karakter, dua subjudul, cover WebP, dan alt text. Draft boleh tanpa cover.
        </p>
        <Button type="submit" loading={pending}>
          <Save aria-hidden="true" />
          {post ? "Simpan perubahan" : status === "published" ? "Terbitkan artikel" : "Simpan artikel"}
        </Button>
      </div>
    </form>
  );
}
