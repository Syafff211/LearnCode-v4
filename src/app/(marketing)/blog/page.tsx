import type { Metadata } from "next";
import Link from "next/link";

import { BlogCategoryPills } from "@/components/blog/blog-category-pills";
import { BlogPostCard } from "@/components/blog/blog-post-card";
import { JsonLd } from "@/components/seo/json-ld";
import { getPublicBlogCategories, getPublishedBlogPosts } from "@/lib/data/blog";
import { canonicalUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

const pageTitle = "Blog LearnCode: panduan praktis coding";
const pageDescription =
  "Panduan berbahasa Indonesia tentang HTML, CSS, JavaScript, dan cara belajar coding lewat contoh serta langkah yang bisa langsung dipraktikkan.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: "/blog" },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: "/blog",
    type: "website",
    siteName: "LearnCode",
    locale: "id_ID",
  },
  twitter: { card: "summary", title: pageTitle, description: pageDescription },
};

export default async function BlogIndexPage() {
  const [posts, categories] = await Promise.all([
    getPublishedBlogPosts({ limit: 30 }),
    getPublicBlogCategories(),
  ]);
  const [featured, ...rest] = posts;

  const structuredPosts = posts.map((post) => ({
    "@type": "BlogPosting",
    headline: post.title,
    ...(post.cover_image && post.cover_image_alt
      ? { image: [{ "@type": "ImageObject", url: post.cover_image, caption: post.cover_image_alt, width: 1200, height: 675 }] }
      : {}),
    url: canonicalUrl(`/blog/${post.slug}`),
    datePublished: post.published_at ?? undefined,
    dateModified: post.updated_at,
    author: {
      "@type": post.author_name && post.author_name !== "LearnCode" ? "Person" : "Organization",
      name: post.author_name?.trim() || "LearnCode",
    },
  }));

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Blog",
              name: "Blog LearnCode",
              url: canonicalUrl("/blog"),
              description: pageDescription,
              inLanguage: "id-ID",
              blogPost: structuredPosts,
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Beranda", item: canonicalUrl("/") },
                { "@type": "ListItem", position: 2, name: "Blog", item: canonicalUrl("/blog") },
              ],
            },
          ],
        }}
      />

      <section className="border-b border-line">
        <div className="container-lc py-10 sm:py-14 lg:py-16">
          <nav aria-label="Breadcrumb" className="mb-5">
            <ol className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
              <li><Link href="/" className="hover:text-ink">Beranda</Link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-ink">Blog</li>
            </ol>
          </nav>
          <p className="eyebrow">Catatan belajar</p>
          <h1 className="display-section mt-3 max-w-[20ch]">Pahami konsep. Lalu tulis kodenya.</h1>
          <p className="lead mt-4 max-w-2xl">
            Panduan praktis tentang HTML, CSS, dan JavaScript—dengan contoh, alasan di balik keputusan, dan tautan ke materi yang bisa langsung kamu coba.
          </p>
          <div className="mt-6">
            <BlogCategoryPills categories={categories} />
          </div>
        </div>
      </section>

      <section className="container-lc py-9 sm:py-12" aria-label="Artikel blog">
        {featured ? (
          <>
            <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
              <BlogPostCard post={featured} featured />
              {rest[0] ? <BlogPostCard post={rest[0]} /> : null}
            </div>
            {rest.length > 1 ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rest.slice(1).map((post) => <BlogPostCard key={post.id} post={post} />)}
              </div>
            ) : null}
          </>
        ) : (
          <div className="rounded-[8px] border border-dashed border-line-strong bg-surface px-5 py-12 text-center">
            <h2 className="font-display text-lg font-semibold text-ink">Belum ada artikel publik</h2>
            <p className="mt-2 text-sm text-muted">Artikel akan muncul di sini setelah diterbitkan.</p>
          </div>
        )}
      </section>
    </>
  );
}
