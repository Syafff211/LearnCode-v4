import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, BookOpen, Mail, MessageCircle, Share2 } from "lucide-react";

import { BlogPostCard } from "@/components/blog/blog-post-card";
import { JsonLd } from "@/components/seo/json-ld";
import { blogAuthorName, formatBlogDate } from "@/lib/blog-utils";
import {
  getPublishedBlogPostBySlug,
  getPublishedBlogPosts,
} from "@/lib/data/blog";
import { getBlogTableOfContents, renderBlogMarkdown } from "@/lib/markdown";
import { canonicalUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);
  if (!post) {
    return {
      title: "Artikel tidak ditemukan",
      robots: { index: false, follow: false },
    };
  }

  const path = `/blog/${post.slug}`;
  const title = post.seo_title?.trim() || post.title;
  const description = post.seo_description?.trim() || post.excerpt;
  const author = blogAuthorName(post.author_name);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: canonicalUrl(path),
      type: "article",
      siteName: "LearnCode",
      locale: "id_ID",
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      authors: [author],
      ...(post.cover_image
        ? { images: [{ url: post.cover_image, alt: post.cover_image_alt ?? post.title }] }
        : {}),
    },
    twitter: {
      card: post.cover_image ? "summary_large_image" : "summary",
      title,
      description,
      ...(post.cover_image
        ? { images: [{ url: post.cover_image, alt: post.cover_image_alt ?? post.title }] }
        : {}),
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);
  if (!post) notFound();

  const [html, relatedPosts] = await Promise.all([
    renderBlogMarkdown(post.content_md),
    getPublishedBlogPosts({ limit: 3, categoryId: post.category_id, excludeId: post.id }),
  ]);
  const toc = getBlogTableOfContents(post.content_md);
  const path = `/blog/${post.slug}`;
  const absoluteUrl = canonicalUrl(path);
  const authorName = blogAuthorName(post.author_name);
  const articleAuthor =
    authorName === "LearnCode"
      ? { "@type": "Organization", name: "LearnCode", url: canonicalUrl("/") }
      : { "@type": "Person", name: authorName };

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "BlogPosting",
              headline: post.title,
              description: post.excerpt,
              url: absoluteUrl,
              mainEntityOfPage: absoluteUrl,
              datePublished: post.published_at,
              dateModified: post.updated_at,
              inLanguage: "id-ID",
              articleSection: post.category?.name,
              author: articleAuthor,
              publisher: {
                "@type": "Organization",
                name: "LearnCode",
                url: canonicalUrl("/"),
              },
              ...(post.cover_image && post.cover_image_alt
                ? {
                    image: [{
                      "@type": "ImageObject",
                      url: post.cover_image,
                      caption: post.cover_image_alt,
                      width: 1200,
                      height: 675,
                    }],
                  }
                : {}),
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Beranda", item: canonicalUrl("/") },
                { "@type": "ListItem", position: 2, name: "Blog", item: canonicalUrl("/blog") },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: post.category?.name ?? "Artikel",
                  item: post.category ? canonicalUrl(`/blog/category/${post.category.slug}`) : canonicalUrl("/blog"),
                },
                { "@type": "ListItem", position: 4, name: post.title, item: absoluteUrl },
              ],
            },
          ],
        }}
      />

      <div className="container-lc py-8 sm:py-10">
        <div className="mx-auto max-w-[850px]">
          <nav aria-label="Breadcrumb" className="mb-7">
            <ol className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
              <li><Link href="/" className="hover:text-ink">Beranda</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/blog" className="hover:text-ink">Blog</Link></li>
              {post.category ? (
                <>
                  <li aria-hidden="true">/</li>
                  <li><Link href={`/blog/category/${post.category.slug}`} className="hover:text-ink">{post.category.name}</Link></li>
                </>
              ) : null}
            </ol>
          </nav>

          <article>
            <header>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                {post.category ? (
                  <Link href={`/blog/category/${post.category.slug}`} className="font-medium text-accent-text hover:underline">
                    {post.category.name}
                  </Link>
                ) : null}
                {post.published_at ? <span aria-hidden="true">·</span> : null}
                {post.published_at ? <time dateTime={post.published_at}>{formatBlogDate(post.published_at)}</time> : null}
                <span aria-hidden="true">·</span>
                <span>{post.reading_minutes} menit baca</span>
              </div>
              <h1 className="display-section mt-4 max-w-[24ch]">{post.title}</h1>
              <p className="lead mt-4 max-w-3xl">{post.excerpt}</p>
              <p className="mt-4 text-xs text-muted">Ditulis oleh <span className="font-medium text-ink-soft">{authorName}</span></p>
            </header>

            {post.cover_image ? (
              <figure className="mt-7 overflow-hidden rounded-[8px] border border-line bg-surface-2">
                <Image
                  src={post.cover_image}
                  alt={post.cover_image_alt ?? post.title}
                  width={1200}
                  height={675}
                  priority
                  sizes="(max-width: 850px) 100vw, 850px"
                  className="aspect-[16/9] h-auto w-full object-cover"
                />
                {post.cover_image_alt ? <figcaption className="px-3 py-2 text-[11px] text-muted">{post.cover_image_alt}</figcaption> : null}
              </figure>
            ) : null}

            {toc.length >= 3 ? (
              <nav aria-label="Daftar isi artikel" className="blog-toc mt-7 rounded-[8px] border border-line bg-surface p-4 sm:p-5">
                <h2 className="text-sm font-semibold text-ink">Daftar isi</h2>
                <ol className="mt-2 space-y-1.5 text-sm">
                  {toc.map((heading) => (
                    <li key={heading.id} className={heading.depth === 3 ? "ml-4" : undefined}>
                      <a href={`#${heading.id}`} className="inline-block py-0.5">{heading.text}</a>
                    </li>
                  ))}
                </ol>
              </nav>
            ) : null}

            <div
              className="prose-lc mt-8 max-w-none"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </article>

          <section className="mt-9 flex flex-wrap items-center justify-between gap-3 border-y border-line py-4" aria-label="Bagikan artikel">
            <p className="inline-flex items-center gap-2 text-xs font-medium text-muted">
              <Share2 className="size-3.5" aria-hidden="true" /> Bagikan artikel
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${post.title} — ${absoluteUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-[5px] border border-line-strong px-3 text-xs text-ink-soft hover:bg-surface-2"
              >
                <MessageCircle className="size-3.5" aria-hidden="true" /> WhatsApp
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(absoluteUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-[5px] border border-line-strong px-3 text-xs text-ink-soft hover:bg-surface-2"
              >
                <ArrowUpRight className="size-3.5" aria-hidden="true" /> X
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(absoluteUrl)}`}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-[5px] border border-line-strong px-3 text-xs text-ink-soft hover:bg-surface-2"
              >
                <Mail className="size-3.5" aria-hidden="true" /> Email
              </a>
            </div>
          </section>

          {post.related_course ? (
            <aside className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-[8px] border border-accent/20 bg-accent-soft/55 p-4 sm:p-5" aria-label="Kursus terkait">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[6px] border border-accent/20 bg-surface text-accent-text">
                  <BookOpen className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="eyebrow">Materi LearnCode terkait</p>
                  <h2 className="mt-1 font-display text-base font-semibold text-ink">{post.related_course.title}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{post.related_course.tagline}</p>
                </div>
              </div>
              <Link href={`/courses/${post.related_course.slug}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-text hover:underline">
                Lihat kursus <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </Link>
            </aside>
          ) : null}

          {relatedPosts.length > 0 ? (
            <section className="mt-12" aria-labelledby="related-posts-heading">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
                <div>
                  <p className="eyebrow">Lanjut membaca</p>
                  <h2 id="related-posts-heading" className="display-title mt-1">Artikel terkait</h2>
                </div>
                {post.category ? (
                  <Link href={`/blog/category/${post.category.slug}`} className="inline-flex items-center gap-1 text-xs font-medium text-accent-text hover:underline">
                    Semua di {post.category.name} <ArrowLeft className="size-3.5 rotate-180" aria-hidden="true" />
                  </Link>
                ) : null}
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedPosts.map((related) => <BlogPostCard key={related.id} post={related} />)}
              </div>
            </section>
          ) : null}

          <div className="mt-10 border-t border-line pt-5">
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-accent-text hover:underline">
              <ArrowLeft className="size-4" aria-hidden="true" /> Kembali ke semua artikel
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
