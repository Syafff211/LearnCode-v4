/* eslint-disable @next/next/no-img-element */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { BlogPostForm } from "@/components/admin/blog-post-form";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { FlashNotice, PageHeader, StatusBadge } from "@/components/admin/primitives";
import { QuickAction } from "@/components/admin/quick-action";
import { Button } from "@/components/ui/button";
import {
  deleteBlogPostAction,
  setBlogPostStatusAction,
  updateBlogPostAction,
} from "@/lib/actions/admin-blog";
import { isPublicationDateReached } from "@/lib/blog-utils";
import { requireAdminPage } from "@/lib/admin/auth";
import { getAdminBlogPost, listBlogCategories, listPublishedCourseOptions } from "@/lib/admin/blog";
import { formatDateTime } from "@/lib/utils";
import { renderBlogMarkdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sunting artikel blog",
  robots: { index: false, follow: false },
};

export default async function BlogPostEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { db } = await requireAdminPage(`/admin/blog/${id}`);
  const post = await getAdminBlogPost(db, id);
  if (!post) notFound();

  const [categories, courses, previewHtml] = await Promise.all([
    listBlogCategories(db),
    listPublishedCourseOptions(db),
    renderBlogMarkdown(post.content_md),
  ]);
  const publicNow =
    post.status === "published" && isPublicationDateReached(post.published_at);

  return (
    <div className="space-y-5">
      <PageHeader
        title={post.title}
        description={`${post.category?.name ?? "Tanpa kategori"} · diperbarui ${formatDateTime(post.updated_at)}`}
        breadcrumb={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Blog", href: "/admin/blog" },
          { label: post.title },
        ]}
        actions={
          <>
            <StatusBadge status={post.status} />
            {publicNow ? (
              <Button asChild size="sm" variant="secondary">
                <Link href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink aria-hidden="true" /> Buka artikel
                </Link>
              </Button>
            ) : null}
            <Button asChild size="sm" variant="ghost"><Link href="/admin/blog">Kembali</Link></Button>
          </>
        }
      />

      {query.created === "1" ? <FlashNotice>Artikel dibuat. Tinjau pratinjau sebelum membagikan atau menerbitkannya.</FlashNotice> : null}
      {query.updated === "1" ? <FlashNotice>Artikel diperbarui.</FlashNotice> : null}

      <div className="flex flex-wrap items-center gap-2 rounded-[8px] border border-line bg-surface p-3">
        <span className="text-[0.8125rem] text-muted">Status cepat:</span>
        {post.status === "published" ? (
          <>
            <QuickAction action={setBlogPostStatusAction} fields={{ postId: post.id, status: "draft" }} label="Jadikan draft" />
            <QuickAction action={setBlogPostStatusAction} fields={{ postId: post.id, status: "archived" }} label="Arsipkan" confirm="Arsipkan artikel ini? Artikel tidak tampil di situs publik." />
          </>
        ) : (
          <QuickAction action={setBlogPostStatusAction} fields={{ postId: post.id, status: "published" }} label="Terbitkan" />
        )}
        {post.published_at ? (
          <span className="ml-auto text-[11px] text-muted">Tanggal publikasi: {formatDateTime(post.published_at)}</span>
        ) : null}
      </div>

      <BlogPostForm
        action={updateBlogPostAction}
        categories={categories}
        courses={courses}
        post={post}
      />

      <section className="rounded-[8px] border border-line bg-surface" aria-labelledby="blog-preview-heading">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <div>
            <h2 id="blog-preview-heading" className="font-display text-base font-semibold text-ink">Pratinjau artikel tersimpan</h2>
            <p className="mt-0.5 text-[11px] text-muted">Pratinjau ini memakai konten tersimpan dan renderer publik yang sama.</p>
          </div>
          <span className="font-mono text-[10px] text-muted">{post.content_md.length} karakter</span>
        </div>
        <div className="mx-auto max-w-[760px] px-4 py-6 sm:px-6 sm:py-8">
          <p className="eyebrow">{post.category?.name ?? "LearnCode"} · {post.reading_minutes} menit baca</p>
          <h2 className="display-title mt-2">{post.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{post.excerpt}</p>
          {post.cover_image ? (
            <img src={post.cover_image} alt={post.cover_image_alt ?? ""} className="mt-5 max-h-80 w-full rounded-[6px] border border-line object-cover" />
          ) : null}
          <div className="prose-lc mt-6 max-w-none" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </div>
      </section>

      <section className="rounded-[8px] border border-danger/30 bg-danger-soft/40 p-4 sm:p-5">
        <h2 className="font-display text-base font-semibold text-ink">Zona berbahaya</h2>
        <p className="mt-1 max-w-2xl text-[0.8125rem] leading-relaxed text-ink-soft">
          Hapus permanen hanya setelah artikel tidak lagi diterbitkan. Aksi ini tercatat di log audit.
        </p>
        <div className="mt-3">
          <ConfirmAction
            action={deleteBlogPostAction}
            fields={{ postId: post.id }}
            title={`Hapus artikel “${post.title}”?`}
            description="Penghapusan permanen. Artikel yang masih berstatus Terbit harus dijadikan draft atau diarsipkan terlebih dahulu."
            triggerLabel="Hapus artikel"
            confirmLabel="Hapus permanen"
            requireText={post.slug}
            textLabel={`Ketik slug “${post.slug}” untuk mengonfirmasi`}
          />
        </div>
      </section>
    </div>
  );
}
